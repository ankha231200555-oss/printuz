<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>403 — Không có quyền</title>
    <style>
        body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-family: sans-serif; color: #111827; }
        .card { background: #fff; padding: 2rem; border-radius: 12px; max-width: 32rem; }
        a { color: #4f46e5; }
    </style>
</head>
<body>
    <div class="card">
        <h1>403 — Không có quyền truy cập</h1>
        <p>{{ $exception->getMessage() ?: 'Bạn không có quyền thực hiện thao tác này.' }}</p>
        <p><a href="{{ url('/') }}">Về trang chủ</a></p>
    </div>
</body>
</html>
