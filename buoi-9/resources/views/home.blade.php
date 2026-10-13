<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Buổi 9 — Validation, Middleware, Authentication & Authorization
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900 space-y-3">
                    <p>Dự án Laravel 12 thực hành đủ 5 bài của buổi 9. Chạy trên Laragon theo hướng dẫn trong <code>README.md</code>.</p>
                    <div class="flex flex-wrap gap-3">
                        <a href="{{ route('articles.index') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md">Xem bài viết</a>
                        @auth
                            <a href="{{ route('articles.create') }}" class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm rounded-md">Viết bài</a>
                        @else
                            <a href="{{ route('login') }}" class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm rounded-md">Đăng nhập</a>
                        @endauth
                    </div>
                </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
                <div class="bg-white shadow-sm sm:rounded-lg p-6">
                    <h3 class="font-semibold text-gray-900">Tài khoản mẫu</h3>
                    <ul class="mt-3 text-sm text-gray-700 space-y-2">
                        <li>Sinh viên: <strong>demo@huit.edu.vn</strong> / password123</li>
                        <li>Quản trị: <strong>admin@huit.edu.vn</strong> / password123</li>
                    </ul>
                </div>
                <div class="bg-white shadow-sm sm:rounded-lg p-6">
                    <h3 class="font-semibold text-gray-900">Năm bài đã làm</h3>
                    <ol class="mt-3 text-sm text-gray-700 list-decimal ps-5 space-y-1">
                        <li>Form Request khi tạo và sửa bài viết</li>
                        <li>Custom Rule cấm từ và upload ảnh</li>
                        <li>Middleware <code>admin</code> và throttle</li>
                        <li>Breeze: đăng ký, đăng nhập, quên mật khẩu</li>
                        <li>Policy: chỉ tác giả được sửa hoặc xóa</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
