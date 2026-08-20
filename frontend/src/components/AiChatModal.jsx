import { Bot, MessageCircle, Send, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useViTriRap } from '../context/ViTriRapContext'
import { guiCauHoiToiAi } from '../services/aiService'
import { layThongBaoLoiApi } from '../utils/layThongBaoLoiApi'
import NoiDungTinNhanBot from './NoiDungTinNhanBot'

const TIN_CHAO = {
  loai: 'bot',
  noiDung: 'Chào anh/chị! Em là Trợ lý AI PhongG Cinema. Hỏi tên phim, lịch chiếu, giá vé hoặc «Rạp ở đâu?» — bật GPS trên web để em tìm rạp gần anh/chị nhất ạ.',
}

const GOI_Y_NHANH = [
  'Giá vé bao nhiêu?',
  'Rạp ở đâu?',
  'Phim đang chiếu',
]

function HieuUngDangNhap() {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-white/10 px-4 py-3">
      <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-300 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-300 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-300 [animation-delay:300ms]" />
    </div>
  )
}

export default function AiChatModal() {
  const { cheDo, viTri, khuVuc } = useViTriRap()
  const [dangMo, datDangMo] = useState(false)
  const [cauHoi, datCauHoi] = useState('')
  const [dangGui, datDangGui] = useState(false)
  const [tinNhan, datTinNhan] = useState([])
  const khungChat = useRef(null)

  const moChat = useCallback(() => {
    datDangMo(true)
    datTinNhan((cu) => (cu.length === 0 ? [TIN_CHAO] : cu))
  }, [])

  useEffect(() => {
    window.addEventListener('open-ai-chat', moChat)
    return () => window.removeEventListener('open-ai-chat', moChat)
  }, [moChat])

  useEffect(() => {
    if (khungChat.current)
      khungChat.current.scrollTop = khungChat.current.scrollHeight
  }, [tinNhan, dangGui])

  const guiTinNhan = async (noiDungGui) => {
    const text = (noiDungGui ?? cauHoi).trim()
    if (!text || dangGui) return
    datCauHoi('')
    datTinNhan((cu) => [...cu, { loai: 'user', noiDung: text }])
    datDangGui(true)
    try {
      const phanHoi = await guiCauHoiToiAi(text, {
        viDo: viTri?.viDo,
        kinhDo: viTri?.kinhDo,
        cheDo,
        khuVuc: khuVuc || undefined,
      })
      datTinNhan((cu) => [...cu, { loai: 'bot', noiDung: phanHoi.answer }])
    } catch (err) {
      datTinNhan((cu) => [...cu, {
        loai: 'bot',
        noiDung: layThongBaoLoiApi(err) || 'Xin lỗi anh/chị, trợ lý tạm thời không phản hồi được. Anh/chị thử lại sau nhé!',
      }])
    } finally {
      datDangGui(false)
    }
  }

  const xuLySubmit = (suKien) => {
    suKien.preventDefault()
    guiTinNhan()
  }

  return (
    <>
      {!dangMo && (
        <button
          type="button"
          onClick={moChat}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#8364ff] text-white shadow-lg shadow-[#8364ff]/40 transition hover:scale-105 hover:bg-[#7050f0] focus:outline-none focus:ring-2 focus:ring-[#8364ff]/60"
          aria-label="Mở trợ lý AI PhongG Cinema"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {dangMo && (
        <div
          className="fixed bottom-6 right-6 z-50 flex h-[min(520px,80vh)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border border-[#8364ff]/30 bg-cinema-900 shadow-2xl shadow-black/50 animate-fade-in-up"
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-[#8364ff] to-fuchsia-600 px-4 py-3.5">
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <Bot size={22} />
              Trợ Lý AI PhongG Cinema — Hỗ trợ 24/7
            </span>
            <button
              type="button"
              onClick={() => datDangMo(false)}
              className="rounded-lg p-1 text-white/90 hover:bg-white/20"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          <div ref={khungChat} className="flex-1 space-y-3 overflow-y-auto p-4">
            {tinNhan.map((tin, chiSo) => (
              <div
                key={chiSo}
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  tin.loai === 'user'
                    ? 'ml-auto bg-[#8364ff] text-white'
                    : 'bg-white/10 text-slate-200'
                }`}
              >
                {tin.loai === 'user' ? tin.noiDung : <NoiDungTinNhanBot noiDung={tin.noiDung} />}
              </div>
            ))}
            {dangGui && <HieuUngDangNhap />}
          </div>

          {tinNhan.length <= 1 && !dangGui && (
            <div className="flex flex-wrap gap-2 border-t border-white/5 px-3 py-2">
              {GOI_Y_NHANH.map((goiY) => (
                <button
                  key={goiY}
                  type="button"
                  onClick={() => guiTinNhan(goiY)}
                  className="rounded-full border border-[#8364ff]/40 bg-[#8364ff]/10 px-3 py-1 text-xs text-fuchsia-200 transition hover:bg-[#8364ff]/25"
                >
                  {goiY}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={xuLySubmit} className="flex gap-2 border-t border-white/10 p-3">
            <input
              className="o-nhap flex-1 py-2.5 text-sm"
              value={cauHoi}
              onChange={(suKien) => datCauHoi(suKien.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={dangGui}
            />
            <button
              type="submit"
              className="flex items-center justify-center rounded-xl bg-[#8364ff] px-3.5 text-white transition hover:bg-[#7050f0] disabled:opacity-50"
              disabled={dangGui || !cauHoi.trim()}
              aria-label="Gửi"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
