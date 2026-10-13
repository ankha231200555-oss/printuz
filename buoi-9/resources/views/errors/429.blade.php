<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>429 — Quá nhiều yêu cầu</title>
    <style>
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-family: sans-serif; color: #111827; }
        .card { background: #fff; padding: 2rem; border-radius: 12px; max-width: 32rem; }
        a { color: #4f46e5; }
    </style>
</head>
<body>
    <div class="card">
        <h1>429 — Too Many Requests</h1>
        <p>Bạn gửi yêu cầu quá nhanh. Vui lòng đợi khoảng một phút rồi thử lại.</p>
        <p><a href="{{ url('/') }}">Về trang chủ</a></p>
    </div>
</body>
</html>
