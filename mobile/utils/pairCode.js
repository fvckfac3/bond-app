// Generate unique 6-character pair code
export const generatePairCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Format pair code with dash (ABC-DEF)
export const formatPairCode = (code) => {
  if (!code || code.length !== 6) return code;
  return `${code.substring(0, 3)}-${code.substring(3)}`;
};

// Remove dash from pair code
export const cleanPairCode = (code) => {
  return code.replace(/-/g, '').toUpperCase();
};