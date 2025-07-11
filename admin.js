// --- THÔNG TIN CẦN THAY ĐỔI ---
const ADMIN_USERNAME = 'giadinh'; // Tài khoản admin
const ADMIN_PASSWORD = 'ngay'; // Mật khẩu admin
const GIST_ID = '....'; // ID của Gist
const GITHUB_TOKEN = '......'; // Token của GitHub

// --- KẾT THÚC PHẦN THAY ĐỔI ---

const loginContainer = document.getElementById('login-container');
const uploadContainer = document.getElementById('upload-container');

function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
        loginContainer.style.display = 'none';
        uploadContainer.style.display = 'block';
    } else {
        document.getElementById('login-error').textContent = 'Tài khoản hoặc mật khẩu không đúng!';
    }
}

function handleUpload() {
    const fileInput = document.getElementById('csvFile');
    const tuanSo = document.getElementById('tuanSoInput').value;
    const statusDiv = document.getElementById('status');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.textContent = 'Vui lòng chọn một file.';
        statusDiv.className = 'error';
        return;
    }

    if (!tuanSo) {
        statusDiv.textContent = 'Vui lòng nhập thông tin Tuần.';
        statusDiv.className = 'error';
        return;
    }
    
    const file = fileInput.files[0];
    statusDiv.textContent = 'Đang xử lý file...';
    statusDiv.className = 'info';

    // Dùng PapaParse để chuyển CSV thành JSON
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const finalJson = {
                tuanSo: tuanSo,
                ngayCapNhat: new Date().toISOString(),
                lichCongTac: results.data
            };
            updateGist(finalJson);
        },
        error: function(err) {
            statusDiv.textContent = `Lỗi khi đọc file: ${err.message}`;
            statusDiv.className = 'error';
        }
    });
}

function updateGist(content) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = 'Đang cập nhật lên server...';
    statusDiv.className = 'info';

    fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            files: {
                'schedule.json': {
                    content: JSON.stringify(content, null, 2) // Dùng null, 2 để format JSON cho đẹp
                }
            }
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Lỗi từ GitHub: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        statusDiv.textContent = 'Cập nhật thành công! Trang chính sẽ có dữ liệu mới sau vài giây.';
        statusDiv.className = 'success';
        document.getElementById('csvFile').value = ''; // Xóa file đã chọn
    })
    .catch(error => {
        statusDiv.textContent = `Cập nhật thất bại: ${error.message}`;
        statusDiv.className = 'error';
        console.error('Lỗi khi cập nhật Gist:', error);
    });
}