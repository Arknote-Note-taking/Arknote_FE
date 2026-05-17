import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-300 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-neutral-800 p-8 rounded-xl shadow-lg border border-neutral-700/50">
        <h1 className="text-3xl font-bold text-white mb-6 border-b border-neutral-700 pb-4">Chính sách Bảo mật (Privacy Policy)</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">1. Thu thập dữ liệu (Data Collection)</h2>
            <p className="mb-2">Hệ thống có thể thu thập:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Địa chỉ Email.</li>
              <li>Tài liệu do người dùng upload.</li>
              <li>Các thẻ (Tags) và Embeddings (Vector dữ liệu).</li>
              <li>Lịch sử tìm kiếm.</li>
              <li>Nhật ký hoạt động (Activity logs).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">2. Sử dụng dữ liệu (Data Usage)</h2>
            <p className="mb-2">Dữ liệu được dùng để:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Xác thực người dùng.</li>
              <li>Cải thiện mô hình AI và chất lượng dịch vụ.</li>
              <li>Tìm kiếm theo ngữ nghĩa (Semantic search).</li>
              <li>Xây dựng Knowledge Graph.</li>
              <li>Đồng bộ hóa dữ liệu theo thời gian thực (Realtime sync).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">3. Bảo vệ dữ liệu (Data Protection)</h2>
            <p className="mb-2">Hệ thống áp dụng các biện pháp bảo mật tiên tiến:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Xác thực bằng JWT (JSON Web Token).</li>
              <li>Băm mật khẩu bằng thuật toán bcrypt.</li>
              <li>Bảo vệ các endpoint API (Protected APIs).</li>
              <li>Giao thức mã hóa HTTPS.</li>
              <li>Xác thực và kiểm tra đầu vào (Input validation).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">4. Quyền của người dùng (User Rights)</h2>
            <p className="mb-2">Người dùng có quyền:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Xem dữ liệu cá nhân và tài liệu của mình.</li>
              <li>Cập nhật thông tin cá nhân.</li>
              <li>Xóa tài liệu đã tải lên.</li>
              <li>Yêu cầu xóa toàn bộ tài khoản và dữ liệu liên quan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">5. Quyền riêng tư của tệp (File Privacy)</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Người dùng chỉ có thể truy cập tài liệu do chính mình upload.</li>
              <li>Quản trị viên (Admin) có quyền quản trị toàn bộ hệ thống để đảm bảo an toàn.</li>
              <li>Các tài liệu riêng tư (Private documents) tuyệt đối không được hiển thị công khai (public).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">6. Dịch vụ bên thứ ba (Third-party Services)</h2>
            <p>Hệ thống có thể sử dụng các dịch vụ bên thứ ba (như OpenAI API, Supabase, Cloud storage services) để xử lý dữ liệu và cung cấp các tính năng AI. Việc xử lý tuân thủ các quy định bảo mật của từng nền tảng.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">7. Cookies & Session</h2>
            <p className="mb-2">Hệ thống sử dụng:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access token & Refresh token.</li>
              <li>Session storage & Local storage.</li>
            </ul>
            <p className="mt-1">Để duy trì trạng thái đăng nhập và trải nghiệm của người dùng.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-accent-blue mb-2">8. Cập nhật chính sách (Policy Updates)</h2>
            <p>Điều khoản Dịch vụ và Chính sách Bảo mật có thể được cập nhật trong tương lai. Việc người dùng tiếp tục sử dụng hệ thống đồng nghĩa với việc đồng ý với các thay đổi mới nhất.</p>
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

export default Privacy;
