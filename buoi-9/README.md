# Buổi 9 — Laravel 12

Validation, Middleware, Authentication (Breeze) và Authorization (Gate/Policy).

Dự án nằm trong thư mục `buoi-9`. Copy cả thư mục này vào Laragon, ví dụ `C:\laragon\www\buoi-9`.

## Chạy trên Laragon

1. Bật **Start All** trong Laragon (Apache + MySQL).
2. Tạo database `buoi9` (HeidiSQL hoặc dòng lệnh):

```sql
CREATE DATABASE buoi9 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Mở terminal tại thư mục dự án (Laragon → Menu → www → buoi-9 → Terminal):

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm install
npm run build
```

4. Laragon tự tạo virtual host. Mở `http://buoi-9.test`.

Nếu tên thư mục khác, sửa `APP_URL` trong `.env` cho khớp (ví dụ `http://buoi9.test`).

File `.env.example` đã trỏ MySQL của Laragon: host `127.0.0.1`, user `root`, mật khẩu để trống, database `buoi9`.

## Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Thành viên | demo@huit.edu.vn | password123 |
| Admin | admin@huit.edu.vn | password123 |

## Bài đã làm

1. **Form Request** — `StoreArticleRequest`, `UpdateArticleRequest`: `required`, `max:255`, `unique`, `min:10`, `sometimes|nullable` cho tags. View dùng `@error` và `old()`.
2. **Custom Rule + ảnh** — `App\Rules\NoForbiddenWords` cấm `test`, `spam`, `xxx`. Ảnh `jpg/jpeg/png`, tối đa 2048 KB, lưu `storage/app/public/articles`, hiển thị bằng `asset('storage/...')`. Khi sửa, `Rule::unique(...)->ignore()` bỏ qua chính bài đang sửa và xóa ảnh cũ.
3. **Middleware + throttle** — `CheckAdmin` đăng ký alias `admin` trong `bootstrap/app.php`. Nhóm `/admin` yêu cầu `auth` rồi `admin`. `GET /api/public-info` giới hạn 60 lần/phút. `GET /throttle-demo` giới hạn 5 lần/phút để dễ thử (lần thứ 6 trả 429). `POST /login` giới hạn 5 lần/phút.
4. **Breeze** — đăng ký, đăng nhập, quên mật khẩu, xác minh email. Khách bị chuyển về `/login` khi viết/sửa/xóa. Menu đổi theo `@guest` / `@auth`, có nút Đăng xuất.
5. **Policy** — `ArticlePolicy`: xem công khai, tạo khi đã đăng nhập, sửa/xóa chỉ khi `article.user_id === auth id`. Kiểm tra ở controller (`$this->authorize`), route (`can:`) và Blade (`@can` / `@cannot`). Gate `access-admin` ẩn/hiện menu Quản trị.

## Kiểm tra nhanh

- Chưa đăng nhập, mở `/articles/create` → về trang đăng nhập.
- Đăng nhập `demo@huit.edu.vn`, tạo bài. Tiêu đề có chữ `spam` hoặc để trống nội dung → lỗi tiếng Việt, dữ liệu cũ còn trên form.
- Ảnh sai định dạng hoặc lớn hơn 2 MB → báo lỗi. Ảnh hợp lệ hiện ở danh sách và trang chi tiết.
- Đăng nhập user khác → không thấy nút Sửa/Xóa; gọi thẳng URL sửa → 403.
- User thường vào `/admin` → 403. Admin vào được.
- Tải `/throttle-demo` 6 lần liên tiếp → 429.
