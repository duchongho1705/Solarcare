import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Cấu hình Firebase từ tài khoản của bạn
const firebaseConfig = {
    apiKey: "AIzaSyD7zZ8jVZNET4EHtQoYDA3_QnR1m1sChBU",
    authDomain: "solarcare-91ebf.firebaseapp.com",
    projectId: "solarcare-91ebf",
    storageBucket: "solarcare-91ebf.firebasestorage.app",
    messagingSenderId: "1067529625528",
    appId: "1:1067529625528:web:970688273919140741794d"
};

// Khởi tạo Firebase App và Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let isEditMode = false;

// 1. Lắng nghe cập nhật nội dung toàn cầu theo thời gian thực (Real-time Global Editing Sync)
const contentDocRef = doc(db, "web_content", "pages_index");
onSnapshot(contentDocRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.data();
        // Chỉ cập nhật DOM nếu người dùng KHÔNG ở chế độ chỉnh sửa để tránh ghi đè thao tác gõ
        if (!isEditMode) {
            document.querySelectorAll('.editable').forEach(el => {
                const id = el.getAttribute('data-id');
                if (id && data[id] !== undefined) {
                    el.innerHTML = data[id];
                }
            });
        }
    }
}, (error) => {
    console.error("Lỗi đồng bộ dữ liệu nội dung Firebase:", error);
});

// 2. Lắng nghe và hiển thị danh sách phản hồi theo thời gian thực (Real-time Feedbacks Sync)
const feedbacksQuery = query(collection(db, "feedbacks"), orderBy("timestamp", "desc"));
onSnapshot(feedbacksQuery, (snapshot) => {
    const list = document.getElementById('feedbackList');
    if (!list) return;

    let htmlContent = '';
    snapshot.forEach((docSnap) => {
        const fb = docSnap.data();
        const name = fb.name || 'Thành viên Ẩn danh';
        const content = fb.content || '';
        const timeString = fb.timeString || '';

        htmlContent += `
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm comment-box animate-fade-in">
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                            ${name.charAt(0).toUpperCase()}
                        </div>
                        <span class="font-bold text-slate-800 text-sm">${name}</span>
                    </div>
                    <span class="text-xs text-slate-400 font-medium">${timeString}</span>
                </div>
                <p class="text-slate-600 text-sm leading-relaxed">${content}</p>
            </div>
        `;
    });
    list.innerHTML = htmlContent;
}, (error) => {
    console.error("Lỗi đồng bộ danh sách phản hồi Firebase:", error);
});

// Hàm chuyển đổi chế độ chỉnh sửa
async function toggleEditMode() {
    isEditMode = !isEditMode;
    const editables = document.querySelectorAll('.editable');
    const btn = document.getElementById('editToggleBtn');

    editables.forEach(el => {
        if (isEditMode) {
            el.setAttribute('contenteditable', 'true');
            el.classList.add('editable-active');
        } else {
            el.setAttribute('contenteditable', 'false');
            el.classList.remove('editable-active');
        }
    });

    if (isEditMode) {
        btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i><span>Lưu Nội Dung</span>';
        btn.classList.replace('bg-white/10', 'bg-blue-600');
        btn.classList.replace('hover:bg-white/20', 'hover:bg-blue-700');
        btn.classList.add('border-blue-600', 'text-white');
    } else {
        btn.innerHTML = '<i class="fa-solid fa-pen-nib mr-2"></i><span>Bật Chỉnh Sửa</span>';
        btn.classList.replace('bg-blue-600', 'bg-white/10');
        btn.classList.replace('hover:bg-blue-700', 'hover:bg-white/20');
        btn.classList.remove('border-blue-600', 'text-white');

        // Lưu toàn bộ nội dung sau khi chỉnh sửa lên Firestore
        const updatedContent = {};
        editables.forEach(el => {
            const id = el.getAttribute('data-id');
            if (id) {
                updatedContent[id] = el.innerHTML;
            }
        });

        try {
            await setDoc(contentDocRef, updatedContent, { merge: true });
            console.log("Đã lưu nội dung cập nhật lên Firebase Firestore thành công!");
        } catch (error) {
            console.error("Lỗi khi lưu nội dung lên Firebase:", error);
            alert("Không thể lưu nội dung. Vui lòng kiểm tra quyền truy cập (Security Rules) trên Firestore.");
        }
    }
}

// Hàm chuyển Tab
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('animate-fade-in');
    });

    const buttons = btnElement.parentElement.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.classList.remove('tab-active');
        btn.classList.add('tab-inactive');
    });

    const content = document.getElementById(tabId + '-content');
    content.classList.remove('hidden');

    btnElement.classList.remove('tab-inactive');
    btnElement.classList.add('tab-active');
}

// Hàm gửi phản hồi
async function addFeedback() {
    const nameInput = document.getElementById('fbName');
    const contentInput = document.getElementById('fbContent');
    const name = nameInput.value.trim() || 'Thành viên Ẩn danh';
    const content = contentInput.value.trim();

    if (content === '') {
        alert('Vui lòng nhập nội dung phản hồi.');
        return;
    }

    const date = new Date();
    const timeString = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    try {
        await addDoc(collection(db, "feedbacks"), {
            name: name,
            content: content,
            timeString: timeString,
            timestamp: Date.now()
        });
        contentInput.value = '';
    } catch (error) {
        console.error("Lỗi khi gửi phản hồi lên Firebase:", error);
        alert("Có lỗi xảy ra khi gửi phản hồi. Vui lòng kiểm tra quyền truy cập Firestore.");
    }
}

// Gán các hàm vào phạm vi toàn cục (window) để các thẻ HTML có thể gọi qua thuộc tính onclick
window.toggleEditMode = toggleEditMode;
window.switchTab = switchTab;
window.addFeedback = addFeedback;
