import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { chuanHoaNoiDungChatAi } from '../utils/chuanHoaTinNhanAi'

export default function NoiDungTinNhanBot({ noiDung }) {
  const daChuanHoa = chuanHoaNoiDungChatAi(noiDung)

  return (
    <div className="space-y-2 leading-relaxed [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_li]:leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>
        {daChuanHoa}
      </ReactMarkdown>
    </div>
  )
}
