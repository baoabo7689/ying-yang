export const translations = {
  home: {
    title: 'Câu đố Âm Dương',
    description: 'Tô màu mỗi ô đen (âm) hoặc trắng (dương) theo luật chơi.',
  },
  header: {
    title: 'Câu đố Âm Dương',
    language: 'Ngôn ngữ',
    toggleLanguage: 'Đổi ngôn ngữ',
    contact: 'Liên hệ',
    help: 'Trợ giúp',
  },
  help: {
    title: 'Trợ giúp',
    common: 'Luật chơi',
    commonHelps: [
      'Không có khối 2×2 nào được toàn một màu.',
      'Tất cả ô đen (âm) phải liên thông theo chiều ngang/dọc.',
      'Tất cả ô trắng (dương) phải liên thông theo chiều ngang/dọc.',
      'Nhấn vào ô xám để đổi màu: xám → đen → trắng → xám.',
      'Ô gợi ý (viền vàng) không thể thay đổi.',
    ],
  },
  init: {
    sectionTitle: 'Khởi tạo',
    randomEasy: 'Ngẫu nhiên Dễ',
    randomMedium: 'Ngẫu nhiên Vừa',
    randomHard: 'Ngẫu nhiên Khó',
    import: 'Nhập',
    manual: 'Thủ công',
    size: 'Kích thước',
  },
  functional: {
    sectionTitle: 'Chức năng',
    validate: 'Kiểm tra',
    export: 'Xuất',
    blockInit: 'Khóa ban đầu',
    reset: 'Đặt lại',
    solve: 'Giải',
  },
  validation: {
    noErrors: '✓ Không có lỗi.',
    twoByTwo: '✗ Khối 2×2 tại ({row},{col}) toàn màu {color}.',
    blackDisconnected: '✗ Ô đen không liên thông tại ({row},{col}).',
    whiteDisconnected: '✗ Ô trắng không liên thông tại ({row},{col}).',
  },
  messages: {
    importLoaded: '✓ Đã nhập câu đố.',
    importError: '✗ Định dạng nhập không hợp lệ.',
    blockInitDone: '✓ Đã khóa trạng thái ban đầu.',
    resetDone: '✓ Đã xóa các ô không phải gợi ý.',
    exportTitle: 'Câu đố xuất ra (B=đen, W=trắng, _=chưa biết):',
  },
};

export default { translations };
