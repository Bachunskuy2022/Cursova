// getAvatarUrl.js
export const getAvatarUrl = (email) => {
  if (!email || typeof email !== 'string') return 'https://i.pravatar.cc/150?img=1';

  const hashCode = [...email].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const avatarIndex = (hashCode % 70) + 1;
  return `https://i.pravatar.cc/150?img=${avatarIndex}`;
};
