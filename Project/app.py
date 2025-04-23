from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
import urllib
from sqlalchemy import text
import pandas as pd
import io
app = Flask(__name__)
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

CORS(app, resources={r"/*": {"origins": "*"}})


bcrypt = Bcrypt(app)

params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-V6KTU57;DATABASE=BD;Trusted_Connection=yes"
)

app.config['SQLALCHEMY_DATABASE_URI'] = "mssql+pyodbc:///?odbc_connect=" + params


db = SQLAlchemy(app)

class UsersRole(db.Model):
    __tablename__ = 'UsersRole'
    RoleId = db.Column(db.Integer, primary_key=True)
    RoleName = db.Column(db.String(50), nullable=False)

    users = db.relationship('User', back_populates='role')

class User(db.Model):
    __tablename__ = 'Users'
    Id = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(100), unique=True, nullable=False)
    PasswordHash = db.Column(db.String, nullable=False)
    RoleId = db.Column(db.Integer, db.ForeignKey('UsersRole.RoleId'), nullable=False)

    role = db.relationship('UsersRole', back_populates='users')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role_id = data.get('role_id')  # очікується число: 1, 2, 3...

    if not username or not password or not role_id:
        return jsonify({'error': 'Усі поля обов’язкові'}), 400

    if not UsersRole.query.get(role_id):
        return jsonify({'error': 'Вказана роль не існує'}), 400

    if User.query.filter_by(Username=username).first():
        return jsonify({'error': 'Користувач з таким ім’ям вже існує'}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(Username=username, PasswordHash=hashed_pw, RoleId=role_id)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Реєстрація успішна'}), 201

# 🔓 Вхід
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(Username=username).first()

    if user and bcrypt.check_password_hash(user.PasswordHash, password):
        return jsonify({
            'message': 'Вхід успішний',
            'role_id': user.RoleId,
            'role_name': user.role.RoleName
        }), 200

    return jsonify({'error': 'Невірне ім’я або пароль'}), 401

# 📄 Отримати список ролей (для React форми)
@app.route('/roles', methods=['GET'])
def get_roles():
    try:
        roles = UsersRole.query.all()
        return jsonify([{'role_id': r.RoleId, 'role_name': r.RoleName} for r in roles])
    except Exception as e:
        print("❌ ПОМИЛКА:", e)
        return jsonify({'error': 'Помилка сервера'}), 500
    
@app.route('/orders/count', methods=['GET'])
def get_orders_count():
    query = text("SELECT COUNT(*) AS total FROM Orders")
    result = db.session.execute(query).scalar()
    return jsonify({'total': result})

@app.route('/orders', methods=['GET'])
def get_orders():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    offset = (page - 1) * limit

    # Основний запит
    query = text("""
        SELECT 
            o.OrderNumber,
            o.Distance,
            o.DeliveryTime,
            o.Price,
            o.OrderDate,
            c.Surname + ' ' + c.Name AS ClientName,
            s.OrderStatus AS StatusName,
            ul.Address + ', ' + upc.PostalCodeName + ', ' + ucity.CityName + ', ' + ureg.RegionName + ', ' + uc.CountryName AS UploadLocation,
            dl.Address + ', ' + dpc.PostalCodeName + ', ' + dcity.CityName + ', ' + dreg.RegionName + ', ' + dc.CountryName AS DownloadLocation,
            oe.StartTime,
            oe.EndTime,
            e.Surname + ' ' + e.Name AS EmployeeName,
            v.LicensePlate
        FROM Orders o
        JOIN Client c ON o.ClientId = c.ClientId
        JOIN OrderStatuses s ON o.StatusId = s.OrderStatusId
        JOIN Locations ul ON o.UploadLocationId = ul.LocationId
        JOIN PostalCodes upc ON ul.PostalId = upc.PostalCodeId
        JOIN City ucity ON upc.CityId = ucity.CItyId
        JOIN Region ureg ON ucity.RegionId = ureg.RegionId
        JOIN Country uc ON ureg.CountryId = uc.CountryId
        JOIN Locations dl ON o.DownloadLocationId = dl.LocationId
        JOIN PostalCodes dpc ON dl.PostalId = dpc.PostalCodeId
        JOIN City dcity ON dpc.CityId = dcity.CItyId
        JOIN Region dreg ON dcity.RegionId = dreg.RegionId
        JOIN Country dc ON dreg.CountryId = dc.CountryId
        LEFT JOIN OrderExecutions oe ON oe.OrderId = o.OrderId
        LEFT JOIN Employees e ON oe.EmployeeId = e.EmployeeId
        LEFT JOIN Vehicles v ON oe.VehicleId = v.VehiclesId
        ORDER BY o.OrderId
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """)

    result = db.session.execute(query, {'offset': offset, 'limit': limit}).fetchall()
    orders = [dict(row._mapping) for row in result]

    count_query = text("SELECT COUNT(*) FROM Orders")
    total_count = db.session.execute(count_query).scalar()

    return jsonify({'orders': orders, 'totalCount': total_count})


@app.route('/drivers', methods=['GET'])
def get_drivers():
    query = text("""
        SELECT 
            e.Name,
            e.Surname,
            e.Email,
            e.PhoneNumber
        FROM Employees e
        WHERE e.PositionId = 1
    """)
    results = db.session.execute(query).fetchall()
    drivers = [dict(row._mapping) for row in results]
    return jsonify(drivers)

@app.route('/drivers', methods=['POST'])
def add_driver():
    data = request.get_json()
    name = data.get('name')
    surname = data.get('surname')
    email = data.get('email')
    phone = data.get('phoneNumber')

    if not name or not surname or not email or not phone:
        return jsonify({'error': 'Усі поля обовʼязкові'}), 400

    try:
        query = text("""
            INSERT INTO Employees (Name, Surname, Email, PhoneNumber, PositionId)
            VALUES (:name, :surname, :email, :phone, 1)
        """)
        db.session.execute(query, {
            'name': name,
            'surname': surname,
            'email': email,
            'phone': phone
        })
        db.session.commit()
        return jsonify({'message': 'Водій успішно доданий'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/vehicles', methods=['GET'])
def get_vehicles():
    query = text("""
        SELECT 
            v.LicensePlate,
            v.VinNumber,
            v.Mileage,
            vs.VehicleStatus AS VehicleStatus,
            vf.Model,
            vf.ReleaseYear,
            vf.PayloadCapacity,
            vf.Volume,
            Round(vf.FuelExpense,2) AS FuelExpense,
            ft.FuelType AS FuelTypeName,
            gt.GearboxType AS GearboxTypeName,
            c.ColourName AS ColorName,
            bt.BrandName,
            vt.VehicleType AS VehicleTypeName
        FROM Vehicles v
        JOIN VehicleStatuses vs ON v.VehicleStatusId = vs.VehicleStatusId
        JOIN VehicleFleets vf ON v.VehicleFleetId = vf.VehicleFleetId
        JOIN Brands bt ON vf.BrandId = bt.BrandId
        JOIN FuelTypes ft ON vf.FuelTypeId = ft.FuelTypesId
        JOIN GearboxTypes gt ON vf.GearboxTypeId = gt.GearboxTypeId
        JOIN Color c ON vf.ColourId = c.ColourId
        JOIN VehicleTypes vt ON vf.VehicleTypeId = vt.VehicleTypeId
    """)

    results = db.session.execute(query).fetchall()
    vehicles = [dict(row._mapping) for row in results]
    return jsonify(vehicles)
@app.route('/payments', methods=['GET'])
def get_paginated_payments():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    offset = (page - 1) * limit

    count_query = text("SELECT COUNT(*) FROM Payments")
    total_count = db.session.execute(count_query).scalar()

    data_query = text("""
        SELECT
            o.OrderNumber,
            p.PaymentDate,
            p.Amount,
            pm.PaymentMethodType AS PaymentMethodName,
            c.Surname + ' ' + c.Name AS ClientName
        FROM Payments p
        JOIN Orders o ON p.OrderId = o.OrderId
        JOIN Client c ON o.ClientId = c.ClientId
        JOIN PaymentMethods pm ON p.PaymentMethodId = pm.PaymentMethodId
        ORDER BY o.OrderNumber
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """)

    rows = db.session.execute(data_query, {'offset': offset, 'limit': limit}).fetchall()
    payments = [dict(row._mapping) for row in rows]

    return jsonify({'payments': payments, 'total': total_count})



@app.route('/export', methods=['POST'])
def export_data():
    data = request.json
    tables = data.get('tables', [])
    formats = data.get('formats', [])

    if not tables or not formats:
        return jsonify({'error': 'Не вказано таблиці або формати'}), 400

    exported_files = {}

    for table in tables:
        query = text(f"SELECT * FROM {table}")
        rows = db.session.execute(query).fetchall()
        df = pd.DataFrame(rows, columns=rows[0].keys() if rows else [])

        for fmt in formats:
            filename = f"{table}.{fmt.lower()}"
            buffer = io.BytesIO()

            if fmt == "CSV":
                df.to_csv(buffer, index=False)
            elif fmt == "JSON":
                buffer.write(df.to_json(orient='records', force_ascii=False).encode('utf-8'))
            elif fmt == "Excel":
                with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
                    df.to_excel(writer, index=False, sheet_name=table)
            elif fmt == "PDF":
                # Поки як заміна PDF — CSV (для демонстрації)
                df.to_csv(buffer, index=False)

            buffer.seek(0)
            exported_files[filename] = buffer.read()

    # Якщо один файл — повертаємо напряму
    if len(exported_files) == 1:
        name, content = next(iter(exported_files.items()))
        return send_file(io.BytesIO(content), as_attachment=True, download_name=name)

    # Якщо декілька — архівуємо у ZIP
    import zipfile
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zipf:
        for name, content in exported_files.items():
            zipf.writestr(name, content)
    zip_buffer.seek(0)

    return send_file(zip_buffer, as_attachment=True, download_name='exported_data.zip', mimetype='application/zip')


# 🌐 Тест
@app.route('/')
def index():
    return 'Сервер працює!'

# ▶️ Запуск
if __name__ == '__main__':
    app.run(debug=True)
