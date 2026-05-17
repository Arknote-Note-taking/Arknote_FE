import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-300 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-neutral-800 p-8 rounded-xl shadow-lg border border-neutral-700/50">
        <h1 className="text-3xl font-bold text-white mb-6 border-b border-neutral-700 pb-4">Điều khoản Dịch vụ (Terms of Service)</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">1. Chấp nhận điều khoản (Acceptance)</h2>
            <p>Khi sử dụng hệ thống Arknote, người dùng đồng ý với tất cả điều khoản và chính sách của nền tảng.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">2. Trách nhiệm của người dùng (User Responsibilities)</h2>
            <p className="mb-2">Người dùng phải:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Cung cấp thông tin hợp lệ.</li>
              <li>Không upload nội dung vi phạm pháp luật.</li>
              <li>Không spam hệ thống.</li>
              <li>Không cố gắng khai thác lỗ hổng bảo mật.</li>
              <li>Chịu trách nhiệm với tài liệu đã upload.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">3. Nội dung bị cấm (Restricted Content)</h2>
            <p className="mb-2">Không cho phép upload:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Malware (phần mềm độc hại).</li>
              <li>Nội dung độc hại, gây thù ghét.</li>
              <li>Tài liệu vi phạm bản quyền.</li>
              <li>Nội dung NSFW (không phù hợp với môi trường học tập/làm việc).</li>
              <li>Tài liệu bất hợp pháp.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">4. Tuyên bố miễn trừ trách nhiệm AI (AI Disclaimer)</h2>
            <p className="mb-2">AI của hệ thống có thể:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Tạo bản tóm tắt không hoàn toàn chính xác.</li>
              <li>Gắn tag (thẻ) sai.</li>
              <li>Trả lời các câu hỏi chưa chính xác 100%.</li>
            </ul>
            <p className="mt-2 text-yellow-400 font-semibold">Lưu ý: Người dùng cần tự kiểm tra lại thông tin quan trọng thay vì tin tưởng hoàn toàn vào AI.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">5. Chấm dứt tài khoản (Account Termination)</h2>
            <p className="mb-2">Hệ thống có quyền:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Khóa tài khoản.</li>
              <li>Xóa dữ liệu.</li>
              <li>Giới hạn quyền truy cập.</li>
            </ul>
            <p className="mt-2">Nếu phát hiện bất kỳ hành vi vi phạm điều khoản nào nêu trên.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-700 flex justify-center">
          <Link to="/register" className="text-accent-blue hover:text-blue-400 transition-colors font-medium">
            &larr; Quay lại trang Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;
