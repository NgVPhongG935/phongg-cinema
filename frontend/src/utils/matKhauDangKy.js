export const HUONG_DAN_MAT_KHAU = 'Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt; không chứa khoảng trắng.'

export function layLoiMatKhauDangKy(matKhau) {
  if (typeof matKhau !== 'string' || matKhau.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
  if (new TextEncoder().encode(matKhau).length > 72) return 'Mật khẩu quá dài (tối đa 72 byte UTF-8).'
  if (/\s/u.test(matKhau)) return 'Mật khẩu không được chứa khoảng trắng.'
  if (!/[A-Z]/.test(matKhau)) return 'Mật khẩu phải có ít nhất một chữ hoa (A–Z).'
  if (!/[a-z]/.test(matKhau)) return 'Mật khẩu phải có ít nhất một chữ thường (a–z).'
  if (!/[0-9]/.test(matKhau)) return 'Mật khẩu phải có ít nhất một chữ số (0–9).'
  if (!/[!-/:-@\[-`{-~]/.test(matKhau)) return 'Mật khẩu phải có ít nhất một ký tự đặc biệt (ví dụ: @, #, !).'
  return ''
}
