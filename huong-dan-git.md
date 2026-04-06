# Hướng Dẫn Sử Dụng Git

## Cài Đặt

```bash
# Ubuntu/Debian
sudo apt install git

# Kiểm tra phiên bản
git --version
```

## Cấu Hình Ban Đầu

```bash
git config --global user.name "Tên của bạn"
git config --global user.email "email@example.com"
```

## Khởi Tạo Repository

```bash
# Tạo repo mới
git init

# Clone repo có sẵn
git clone https://github.com/user/repo.git
```

## Các Lệnh Cơ Bản

### Kiểm Tra Trạng Thái

```bash
git status
git log --oneline
git diff
```

### Thêm và Commit

```bash
# Thêm file cụ thể
git add ten-file.txt

# Thêm tất cả thay đổi
git add .

# Tạo commit
git commit -m "Mô tả thay đổi"
```

### Branch

```bash
# Xem danh sách branch
git branch

# Tạo branch mới
git branch ten-branch

# Chuyển sang branch
git checkout ten-branch

# Tạo và chuyển cùng lúc
git checkout -b ten-branch-moi

# Xóa branch
git branch -d ten-branch
```

### Merge và Rebase

```bash
# Merge branch vào branch hiện tại
git merge ten-branch

# Rebase
git rebase main
```

### Remote

```bash
# Xem remote
git remote -v

# Thêm remote
git remote add origin https://github.com/user/repo.git

# Đẩy code lên remote
git push origin main

# Kéo code từ remote
git pull origin main

# Fetch (không merge)
git fetch origin
```

## Hoàn Tác Thay Đổi

```bash
# Hoàn tác file chưa staged
git restore ten-file.txt

# Bỏ staged một file
git restore --staged ten-file.txt

# Hoàn tác commit cuối (giữ thay đổi)
git reset --soft HEAD~1

# Xem lịch sử để revert
git revert <commit-hash>
```

## Stash

```bash
# Lưu thay đổi tạm thời
git stash

# Xem danh sách stash
git stash list

# Lấy lại stash gần nhất
git stash pop

# Xóa stash
git stash drop
```

## Xem Lịch Sử

```bash
# Log đầy đủ
git log

# Log rút gọn
git log --oneline --graph --all

# Lịch sử của một file
git log -- ten-file.txt

# Xem thay đổi của commit
git show <commit-hash>
```

## .gitignore

Tạo file `.gitignore` để bỏ qua các file không cần theo dõi:

```
# Thư mục build
/dist
/build
/node_modules

# File môi trường
.env
.env.local

# Log
*.log

# OS
.DS_Store
Thumbs.db
```

## Quy Trình Làm Việc Thông Thường

```bash
# 1. Cập nhật code mới nhất
git pull origin main

# 2. Tạo branch cho tính năng mới
git checkout -b feature/ten-tinh-nang

# 3. Viết code, sau đó commit
git add .
git commit -m "feat: thêm tính năng X"

# 4. Đẩy branch lên remote
git push origin feature/ten-tinh-nang

# 5. Tạo Pull Request trên GitHub/GitLab
```
