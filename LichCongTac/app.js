// --- THÔNG TIN CẦN THAY ĐỔI ---
// Admin sẽ tạo Gist này và dán ID vào đây
const GIST_ID = 'c2922af4a12bdbf22a75d48add7101ff'; 
// --- KẾT THÚC PHẦN THAY ĐỔI ---

document.addEventListener('DOMContentLoaded', function() {
    fetchSchedule();

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', filterTable);

    const printButton = document.getElementById('printButton');
    printButton.addEventListener('click', () => window.print());
});

function fetchSchedule() {
    const scheduleTableBody = document.querySelector('#scheduleTable tbody');
    scheduleTableBody.innerHTML = '<tr><td colspan="7">Đang tải dữ liệu...</td></tr>';

    // Sử dụng cache-busting để luôn lấy dữ liệu mới nhất
    const url = `https://api.github.com/gists/${GIST_ID}?t=${new Date().getTime()}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const fileContent = data.files['schedule.json']?.content;
            if (fileContent) {
                const scheduleData = JSON.parse(fileContent);
                renderSchedule(scheduleData);
            } else {
                throw new Error("Không tìm thấy file 'schedule.json' trong Gist.");
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải lịch:', error);
            scheduleTableBody.innerHTML = '<tr><td colspan="7" class="error-cell">Không thể tải lịch công tác. Vui lòng kiểm tra lại GIST_ID.</td></tr>';
        });
}

function renderSchedule(data) {
    document.getElementById('tuanSo').textContent = `Tuần ${data.tuanSo}`;
    const updateDate = new Date(data.ngayCapNhat);
    document.getElementById('ngayCapNhat').textContent = updateDate.toLocaleString('vi-VN');
    const scheduleTableBody = document.querySelector('#scheduleTable tbody');
    scheduleTableBody.innerHTML = '';

    // Cập nhật colspan cho các thông báo
    const colspanValue = 8; 

    if (!data.lichCongTac || data.lichCongTac.length === 0) {
        scheduleTableBody.innerHTML = `<tr><td colspan="${colspanValue}">Không có lịch công tác trong tuần.</td></tr>`;
        return;
    }
    
    data.lichCongTac.forEach(item => {
        const row = document.createElement('tr');
        
        // Tạo link Lịch .ics
        const icsLink = generateIcsLink(item);

        // --- BẮT ĐẦU PHẦN TẠO LINK ZALO ---
        // 1. Tạo nội dung chia sẻ
        const zaloMessage = `Lịch công tác - ${item.ngay}:\n- Nội dung: ${item.noiDung}\n- Địa điểm: ${item.diaDiem}\n- Tham gia: ${item.thamGia}`;
        
        // 2. Mã hóa nội dung để chèn vào URL
        const encodedZaloMessage = encodeURIComponent(zaloMessage);
        
        // 3. Tạo link chia sẻ Zalo hoàn chỉnh
        const zaloShareLink = `https://zalo.me/share/dpa/dpa_open_sharebox_from_web?d=${encodedZaloMessage}`;
        // --- KẾT THÚC PHẦN TẠO LINK ZALO ---

        // Thêm các cột vào hàng, bao gồm cả nút Zalo mới
        row.innerHTML = `
            <td data-label="Ngày">${item.ngay}</td>
            <td data-label="Buổi">${item.buoi}</td>
            <td data-label="Nội dung">${item.noiDung}</td>
            <td data-label="Địa điểm">${item.diaDiem}</td>
            <td data-label="Tham gia">${item.thamGia}</td>
            <td data-label="Ghi chú">${item.ghiChu}</td>
            <td data-label="Thêm lịch" class="no-print">
                <a href="${icsLink}" target="_blank" class="calendar-button" title="Thêm vào lịch cá nhân">📅</a>
            </td>
            <td data-label="Chia sẻ" class="no-print">
                <a href="${zaloShareLink}" target="_blank" class="zalo-button" title="Chia sẻ qua Zalo">
                    <img src="https://brand.zalo.me/favicon.png" alt="Zalo" style="width: 24px; vertical-align: middle;">
                </a>
            </td>
        `;
        scheduleTableBody.appendChild(row);
    });

    highlightCurrentDay();
}

function filterTable() {
    const filter = document.getElementById('searchInput').value.toUpperCase();
    const rows = document.querySelectorAll('#scheduleTable tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toUpperCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
}

function highlightCurrentDay() {
    const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const today = weekdays[new Date().getDay()];
    const rows = document.querySelectorAll('#scheduleTable tbody tr');
    rows.forEach(row => {
        const dayCell = row.querySelector('td:first-child');
        if (dayCell && dayCell.textContent.includes(today)) {
            row.classList.add('current-day');
        }
    });
}

function generateIcsLink(item) {
    // Giả định ngày bắt đầu của tuần (cần điều chỉnh logic này nếu muốn chính xác tuyệt đối)
    // Đây là một cách đơn giản hóa, giả sử sự kiện diễn ra trong tuần hiện tại hoặc tương lai gần.
    // Để chính xác, cần phân tích chuỗi ngày (vd: "Thứ Hai (07/07)")
    const suKien = {
        tieuDe: item.noiDung,
        diaDiem: item.diaDiem,
        moTa: `Tham gia: ${item.thamGia}\nGhi chú: ${item.ghiChu}`
    };

    // Định dạng thô sơ cho ngày bắt đầu/kết thúc (cần logic phức tạp hơn để chính xác)
    // Ví dụ: Lấy ngày hiện tại và đặt giờ cho sáng/chiều
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    let startTime = item.buoi.toLowerCase() === 'sáng' ? '080000' : '133000';
    let endTime = item.buoi.toLowerCase() === 'sáng' ? '120000' : '170000';
    
    // Cấu trúc file .ics
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `URL:${document.location.href}`,
        `DTSTART;VALUE=DATE-TIME:${year}${month}${day}T${startTime}`,
        `DTEND;VALUE=DATE-TIME:${year}${month}${day}T${endTime}`,
        `SUMMARY:${suKien.tieuDe}`,
        `DESCRIPTION:${suKien.moTa}`,
        `LOCATION:${suKien.diaDiem}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
}