#!/bin/bash
# Kịch bản tự động cập nhật mã nguồn lên GitHub cho dự án SolarCare

echo "========================================================"
echo "🚀 Bắt đầu cập nhật mã nguồn SolarCare lên GitHub..."
echo "========================================================"

# Thêm tất cả tệp có sự thay đổi
git add .

# Commit với thông báo tự động đính kèm mốc thời gian
COMMIT_MSG="Tự động cập nhật mã nguồn: $(date +'%d/%m/%Y %H:%M:%S')"
git commit -m "$COMMIT_MSG"

# Đẩy mã nguồn lên nhánh main
echo "Đang đẩy dữ liệu lên GitHub..."
git push origin main

echo "========================================================"
echo "✅ Đã hoàn tất đồng bộ mã nguồn lên GitHub thành công!"
echo "========================================================"
