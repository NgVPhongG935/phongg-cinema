/**
 * Chuẩn hóa văn bản trả lời AI để hiển thị dễ đọc (xuống dòng, danh sách).
 */
export function chuanHoaNoiDungChatAi(noiDung) {
  if (!noiDung) return ''

  let s = String(noiDung).trim()

  // Chuyển dấu chấm tròn inline thành danh sách markdown
  s = s.replace(/\s*•\s*/g, '\n- ')

  // Chuẩn hóa xuống dòng Windows/Mac
  s = s.replace(/\r\n/g, '\n')

  // Thêm khoảng thở giữa các đoạn (tối đa 2 dòng trống)
  s = s.replace(/\n{3,}/g, '\n\n')

  // Gỡ khoảng trắng thừa đầu dòng danh sách
  s = s.replace(/\n-\s+/g, '\n- ')

  return s.trim()
}
