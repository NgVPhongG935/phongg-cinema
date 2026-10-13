// Date-only form values must match the day displayed in the user's browser.
export function ngayDiaPhuong(ngay = new Date()) {
  return `${ngay.getFullYear()}-${String(ngay.getMonth() + 1).padStart(2, '0')}-${String(ngay.getDate()).padStart(2, '0')}`
}
