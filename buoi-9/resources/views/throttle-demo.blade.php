<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Throttle demo</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white shadow-sm sm:rounded-lg p-6 space-y-3 text-gray-800">
                <p>Route này gắn <code>throttle:5,1</code>: tối đa 5 lượt mỗi phút. Lượt thứ 6 trả về 429 Too Many Requests.</p>
                <p>API công khai <code>GET /api/public-info</code> gắn <code>throttle:60,1</code>.</p>
                <p>Đăng nhập <code>POST /login</code> gắn <code>throttle:5,1</code> để chống dò mật khẩu. Breeze cũng giới hạn 5 lần sai trên từng email.</p>
                <p class="text-sm text-gray-500">Tải lại trang này liên tục để thấy lỗi 429.</p>
            </div>
        </div>
    </div>
</x-app-layout>
