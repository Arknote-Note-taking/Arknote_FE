import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const translations = {
  vi: {
    // Sidebar & Common
    overview: "Tổng quan",
    documents: "Tài liệu",
    flashcards: "Thẻ ghi nhớ",
    quizzes: "Bài trắc nghiệm",
    knowledgeMap: "Sơ đồ tri thức",
    profile: "Hồ sơ cá nhân",
    logout: "Đăng xuất",
    pro: "PRO",
    free: "FREE",
    systemOverview: "Tổng quan hệ thống",
    aiAnalysis: "AI phân tích",
    users: "Khách hàng",
    overviewDesc: "Thống kê hoạt động lưu trữ và ôn tập của bạn",
    newChat: "Trò chuyện mới",
    searchChats: "Tìm kiếm trò chuyện...",
    freeChat: "Trò chuyện tự do (Không tài liệu)",
    uploadNewDoc: "Tải lên tài liệu mới",
    existingDocs: "Tài liệu đã có",
    existingFolders: "Thư mục đã có",
    edit: "Chỉnh sửa",
    displayName: "Tên hiển thị",
    emailAddress: "Địa chỉ Email",
    plan: "Gói tài khoản",
    all: "Tất cả",

    // Overview / Dashboard
    totalDocs: "Tài liệu lưu trữ",
    flashcardDecks: "Bộ thẻ Flashcard",
    quizzesCreated: "Bài trắc nghiệm (Quiz)",
    statsByCategory: "Phân loại theo danh mục",
    recentDocs: "Tài liệu gần đây",
    recentAttempts: "Kết quả luyện tập gần đây",
    recentDecks: "Bộ thẻ ghi nhớ gần đây",
    noData: "Chưa có dữ liệu.",
    noDocs: "Chưa có tài liệu nào.",
    noAttempts: "Chưa có lượt làm bài nào.",
    noDecks: "Chưa có bộ thẻ nào.",
    custom: "Tự tạo",
    aiGen: "AI Tạo",

    // Quizzes & History
    quizHistory: "Lịch sử làm bài",
    quizzesCreatedTab: "Quizzes đã tạo",
    searchQuiz: "Tìm Quiz...",
    searchHistory: "Tìm lịch sử...",
    refreshList: "Làm mới",
    score: "Điểm số",
    timeSpent: "Thời gian làm",
    completed: "Hoàn thành",
    inProgress: "Đang làm",
    takeQuiz: "Làm bài",
    retakeQuiz: "Làm tiếp",
    viewResult: "Xem kết quả",
    newAttempt: "Làm lượt mới",
    deleteQuiz: "Xóa bài Quiz",
    noQuizzesCreated: "Chưa có bài Quiz nào được tạo.",
    noQuizzesCreatedDesc: "Hãy mở một tài liệu bất kỳ và bấm nút \"Tạo Quiz AI\" để hệ thống tự động soạn bài tập!",
    noAttemptsHistory: "Chưa có lịch sử làm bài nào.",
    noAttemptsHistoryDesc: "Hãy mở một tài liệu và bấm nút \"Tạo Quiz AI\" để bắt đầu ôn luyện!",

    // Profile
    myProfile: "Hồ sơ của tôi",
    changePassword: "Thay đổi mật khẩu",
    language: "Ngôn ngữ",
    notifications: "Thông báo",
    role: "Phân quyền",
    phone: "Số điện thoại",
    location: "Địa lý",
    roleUser: "Thành viên",
    roleAdmin: "Quản trị viên",
    notifAllow: "Cho phép",
    notifMute: "Tắt tiếng",
    saveChanges: "Lưu thay đổi",
    cancel: "Hủy bỏ",
    oldPassword: "Mật khẩu cũ",
    newPassword: "Mật khẩu mới",
    confirmNewPassword: "Xác nhận mật khẩu mới",
    updatePassword: "Cập nhật mật khẩu",

    // Flashcards
    searchDecks: "Tìm kiếm bộ thẻ...",
    createDeck: "Tạo bộ thẻ",
    noDecksCreated: "Chưa có bộ Flashcard nào",
    noDecksCreatedDesc: "Bạn có thể tạo bộ thẻ trắc nghiệm trống hoặc mở trang tài liệu bất kỳ và bấm \"Tạo Flashcards bằng AI\" để hệ thống tự động sinh câu hỏi ôn tập.",
    studyNow: "Học ngay",
    frontSide: "Mặt Trước (Câu Hỏi)",
    backSide: "Mặt Sau (Đáp Án)",
    correct: "Đúng",
    incorrect: "Sai",

    // Documents
    allDocs: "Tất cả tài liệu",
    searchDocs: "Tìm kiếm tài liệu...",
    uploadDoc: "Tải tài liệu lên",
    folders: "Thư mục",
    trash: "Thùng rác",
    aiGenerate: "Tạo bằng AI",
    dateCreated: "Ngày tạo",
    actions: "Hành động"
  },
  en: {
    // Sidebar & Common
    overview: "Dashboard",
    documents: "Documents",
    flashcards: "Flashcards",
    quizzes: "Quizzes",
    knowledgeMap: "Knowledge Map",
    profile: "Profile",
    logout: "Log Out",
    pro: "PRO",
    free: "FREE",
    systemOverview: "System Overview",
    aiAnalysis: "AI Analysis",
    users: "Customers",
    overviewDesc: "Activity statistics for your storage and study",
    newChat: "New Chat",
    searchChats: "Search chats...",
    freeChat: "Free Chat (No document)",
    uploadNewDoc: "Upload new document",
    existingDocs: "Existing documents",
    existingFolders: "Existing folders",
    edit: "Edit",
    displayName: "Display Name",
    emailAddress: "Email Address",
    plan: "Account Plan",
    all: "All",

    // Overview / Dashboard
    totalDocs: "Stored Documents",
    flashcardDecks: "Flashcard Decks",
    quizzesCreated: "Quizzes",
    statsByCategory: "Category Breakdown",
    recentDocs: "Recent Documents",
    recentAttempts: "Recent Practice Results",
    recentDecks: "Recent Flashcard Decks",
    noData: "No data available.",
    noDocs: "No documents found.",
    noAttempts: "No attempts found.",
    noDecks: "No decks found.",
    custom: "Custom",
    aiGen: "AI Gen",

    // Quizzes & History
    quizHistory: "Attempt History",
    quizzesCreatedTab: "Created Quizzes",
    searchQuiz: "Search Quizzes...",
    searchHistory: "Search history...",
    refreshList: "Refresh",
    score: "Score",
    timeSpent: "Time Spent",
    completed: "Completed",
    inProgress: "In Progress",
    takeQuiz: "Take Quiz",
    retakeQuiz: "Resume",
    viewResult: "View Result",
    newAttempt: "Retake",
    deleteQuiz: "Delete Quiz",
    noQuizzesCreated: "No quizzes created yet.",
    noQuizzesCreatedDesc: "Open any document and click \"AI Quiz Gen\" to automatically generate a quiz!",
    noAttemptsHistory: "No quiz attempts found.",
    noAttemptsHistoryDesc: "Open a document and click \"AI Quiz Gen\" to start learning!",

    // Profile
    myProfile: "My Profile",
    changePassword: "Change Password",
    language: "Language",
    notifications: "Notifications",
    role: "User Role",
    phone: "Phone Number",
    location: "Location",
    roleUser: "User",
    roleAdmin: "Admin",
    notifAllow: "Allow",
    notifMute: "Muted",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    oldPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePassword: "Update Password",

    // Flashcards
    searchDecks: "Search decks...",
    createDeck: "Create Deck",
    noDecksCreated: "No Flashcard Decks Yet",
    noDecksCreatedDesc: "You can create an empty deck or open any document and click \"AI Flashcards Gen\" to automatically generate review questions.",
    studyNow: "Study Now",
    frontSide: "Front Side (Question)",
    backSide: "Back Side (Answer)",
    correct: "Correct",
    incorrect: "Incorrect",

    // Documents
    allDocs: "All Documents",
    searchDocs: "Search documents...",
    uploadDoc: "Upload Document",
    folders: "Folders",
    trash: "Trash",
    aiGenerate: "AI Gen",
    dateCreated: "Date Created",
    actions: "Actions"
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('profile_lang') || 'vi');

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('profile_lang', lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
