from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
import urllib
from sqlalchemy import text
import pandas as pd
import io
from flask import send_file
app = Flask(__name__)
CORS(app, origins="http://localhost:3000")
bcrypt = Bcrypt(app)

params = urllib.parse.quote_plus("DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-V6KTU57;DATABASE=BD;Trusted_Connection=yes")
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
    role_id = data.get('role_id')

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
from flask import request
from sqlalchemy import text

@app.route('/orders', methods=['GET'])
def get_orders():
    search = request.args.get('search', '').strip()
    base_query = """
        SELECT 
            o.OrderId,
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
            e.Email AS EmployeeEmail,
            v.LicensePlate,
            (
              SELECT STRING_AGG(p.Name + ' — ' + CAST(op.ProductCount AS NVARCHAR), ', ')
              FROM OrderProducts op
              JOIN Products p ON p.ProductId = op.ProductId
              WHERE op.OrderId = o.OrderId
            ) AS Products
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
        WHERE (:search = '' OR 
            o.OrderNumber LIKE :searchLike OR
            c.Name LIKE :searchLike OR
            c.Surname LIKE :searchLike OR
            e.Name LIKE :searchLike OR
            e.Surname LIKE :searchLike OR
            ul.Address LIKE :searchLike OR
            dl.Address LIKE :searchLike
        )
    """

    count_query = """
        SELECT COUNT(*)
            FROM Orders o
            JOIN Client c ON o.ClientId = c.ClientId
            JOIN OrderStatuses s ON o.StatusId = s.OrderStatusId
            LEFT JOIN OrderExecutions oe ON oe.OrderId = o.OrderId
            LEFT JOIN Employees e ON oe.EmployeeId = e.EmployeeId
            LEFT JOIN Vehicles v ON oe.VehicleId = v.VehiclesId
            JOIN Locations ul ON o.UploadLocationId = ul.LocationId
            JOIN Locations dl ON o.DownloadLocationId = dl.LocationId
            WHERE (:search = '' OR 
                o.OrderNumber LIKE :searchLike OR
                c.Name LIKE :searchLike OR
                c.Surname LIKE :searchLike OR
                e.Name LIKE :searchLike OR
                e.Surname LIKE :searchLike OR
                ul.Address LIKE :searchLike OR
                dl.Address LIKE :searchLike OR
                o.OrderDate LIKE :searchLike OR
                oe.StartTime LIKE :searchLike OR
                oe.EndTime LIKE :searchLike OR
                s.OrderStatus LIKE :searchLike OR
                CAST(o.Price AS NVARCHAR) LIKE :searchLike OR
                CAST(o.Distance AS NVARCHAR) LIKE :searchLike OR
                CAST(o.DeliveryTime AS NVARCHAR) LIKE :searchLike OR
                v.LicensePlate LIKE :searchLike
            )
    """

    params = {
        'search': search,
        'searchLike': f'%{search}%',
    }

    result = db.session.execute(text(base_query), params).fetchall()
    orders = [dict(row._mapping) for row in result]
    total_count = db.session.execute(text(count_query), params).scalar()

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
            v.VehiclesId,
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
@app.route('/orders/last-number')
def get_last_order_number():
    result = db.session.execute(text("SELECT MAX(OrderNumber) AS lastNumber FROM Orders")).fetchone()
    return jsonify({'lastNumber': result.lastNumber})

@app.route('/employees')
def get_employees():
    employees = db.session.execute(text("SELECT EmployeeId, Surname + ' ' + Name AS FullName FROM Employees")).fetchall()
    return jsonify([dict(row._mapping) for row in employees])

@app.route('/postalcodes')
def get_postalcodes():
    postalcodes = db.session.execute(text("SELECT PostalCodeId, PostalCodeName FROM PostalCodes")).fetchall()
    return jsonify([dict(row._mapping) for row in postalcodes])

@app.route('/country', methods=['GET'])
def get_countries():
    query = text("SELECT CountryId, CountryName FROM Country")
    result = db.session.execute(query).fetchall()
    return jsonify([dict(row._mapping) for row in result])

@app.route('/region')
def get_regions_by_country():
    country_id = request.args.get('countryId')
    if not country_id:
        return jsonify({'error': 'Не вказано ID країни'}), 400

    query = text("SELECT RegionId, RegionName FROM Region WHERE CountryId = :country_id")
    results = db.session.execute(query, {'country_id': country_id}).fetchall()
    return jsonify([dict(row._mapping) for row in results])

@app.route('/city', methods=['GET'])
def get_cities_by_region():
    region_id = request.args.get('regionId')

    if not region_id:
        return jsonify({'error': 'Не вказано regionId'}), 400

    query = text("""
        SELECT CItyId, CityName
        FROM City
        WHERE RegionId = :region_id
    """)
    results = db.session.execute(query, {'region_id': region_id}).fetchall()
    return jsonify([dict(row._mapping) for row in results])

@app.route('/postalcodes', methods=['GET'])
def get_postal_codes_by_city():
    city_id = request.args.get('cityId')

    if not city_id:
        return jsonify({'error': 'Не вказано cityId'}), 400

    query = text("""
        SELECT PostalCodeId, PostalCodeName
        FROM PostalCodes
        WHERE CityId = :city_id
    """)
    results = db.session.execute(query, {'city_id': city_id}).fetchall()
    return jsonify([dict(row._mapping) for row in results])

@app.route('/locations-by-postal', methods=['GET'])
def get_locations_by_postal():
    postal_id = request.args.get('postalId')
    if not postal_id:
        return jsonify({'error': 'Не вказано поштовий індекс'}), 400

    query = text("""
        SELECT LocationId, Address
        FROM Locations
        WHERE PostalId = :postal_id
    """)
    rows = db.session.execute(query, {'postal_id': postal_id}).fetchall()
    return jsonify([dict(row._mapping) for row in rows])

@app.route('/locations/smart-add', methods=['POST'])
def smart_add_location():
    data = request.get_json()
    country_name = data.get('country')
    region_name = data.get('region')
    city_name = data.get('city')
    postal_code_name = data.get('postalCode')
    address = data.get('address')

    if not all([country_name, region_name, city_name, postal_code_name, address]):
        return jsonify({'error': 'Усі поля обов’язкові'}), 400

    # 1. Country
    country_id = db.session.execute(text("SELECT CountryId FROM Country WHERE CountryName = :name"), {'name': country_name}).scalar()
    if not country_id:
        db.session.execute(text("INSERT INTO Country (CountryName) VALUES (:name)"), {'name': country_name})
        db.session.commit()
        country_id = db.session.execute(text("SELECT CountryId FROM Country WHERE CountryName = :name"), {'name': country_name}).scalar()

    # 2. Region
    region_id = db.session.execute(text("SELECT RegionId FROM Region WHERE RegionName = :name AND CountryId = :cid"), {'name': region_name, 'cid': country_id}).scalar()
    if not region_id:
        db.session.execute(text("INSERT INTO Region (RegionName, CountryId) VALUES (:name, :cid)"), {'name': region_name, 'cid': country_id})
        db.session.commit()
        region_id = db.session.execute(text("SELECT RegionId FROM Region WHERE RegionName = :name AND CountryId = :cid"), {'name': region_name, 'cid': country_id}).scalar()

    # 3. City
    city_id = db.session.execute(text("SELECT CItyId FROM City WHERE CityName = :name AND RegionId = :rid"), {'name': city_name, 'rid': region_id}).scalar()
    if not city_id:
        db.session.execute(text("INSERT INTO City (CityName, RegionId) VALUES (:name, :rid)"), {'name': city_name, 'rid': region_id})
        db.session.commit()
        city_id = db.session.execute(text("SELECT CItyId FROM City WHERE CityName = :name AND RegionId = :rid"), {'name': city_name, 'rid': region_id}).scalar()

    # 4. PostalCode
    postal_id = db.session.execute(text("SELECT PostalCodeId FROM PostalCodes WHERE PostalCodeName = :name AND CityId = :cid"), {'name': postal_code_name, 'cid': city_id}).scalar()
    if not postal_id:
        db.session.execute(text("INSERT INTO PostalCodes (PostalCodeName, CityId) VALUES (:name, :cid)"), {'name': postal_code_name, 'cid': city_id})
        db.session.commit()
        postal_id = db.session.execute(text("SELECT PostalCodeId FROM PostalCodes WHERE PostalCodeName = :name AND CityId = :cid"), {'name': postal_code_name, 'cid': city_id}).scalar()

    # 5. Location
    location_id = db.session.execute(text("SELECT LocationId FROM Locations WHERE Address = :addr AND PostalId = :pid"), {'addr': address, 'pid': postal_id}).scalar()
    if not location_id:
        db.session.execute(text("INSERT INTO Locations (Address, PostalId) VALUES (:addr, :pid)"), {'addr': address, 'pid': postal_id})
        db.session.commit()
        location_id = db.session.execute(text("SELECT LocationId FROM Locations WHERE Address = :addr AND PostalId = :pid"), {'addr': address, 'pid': postal_id}).scalar()

    return jsonify({'locationId': location_id})

@app.route('/locations')
def get_locations():
    locations = db.session.execute(text("SELECT LocationId, Address FROM Locations")).fetchall()
    return jsonify([dict(row._mapping) for row in locations])

@app.route('/clients')
def get_clients():
    clients = db.session.execute(text("SELECT ClientId, Surname + ' ' + Name AS FullName FROM Client")).fetchall()
    return jsonify([dict(row._mapping) for row in clients])

@app.route('/export', methods=['POST'])
def export():
    data = request.json
    table = data.get('table')
    fmt = data.get('format')

    if not table or not fmt:
        return jsonify({'error': 'Невірні дані'}), 400
    export_queries = {
            'Замовлення': """SELECT * FROM Orders""",
            'Оплати': """SELECT ...""",
            'Водії': """SELECT ...""",
            'Автопарк': """SELECT ..."""
        }
    query_text = export_queries.get(table)
    if not query_text:
        return jsonify({'error': 'Невідома таблиця'}), 400

    rows = db.session.execute(text(query_text)).fetchall()
    df = pd.DataFrame([dict(row._mapping) for row in rows])
    if df.empty:
        return jsonify({'error': 'Немає даних'}), 404

    buffer = io.BytesIO()
    filename = f"{table}.{fmt.lower()}"

    if fmt == "CSV":
        df.to_csv(buffer, index=False)
    elif fmt == "JSON":
        buffer.write(df.to_json(orient='records', force_ascii=False).encode('utf-8'))
    elif fmt == "Excel":
        with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name=table)
    elif fmt == "PDF":
        df.to_csv(buffer, index=False)
    else:
        return jsonify({'error': 'Непідтримуваний формат'}), 400

    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=filename)

@app.route('/')
def index():
    return 'Сервер працює!'

if __name__ == '__main__':
    app.run(debug=True)