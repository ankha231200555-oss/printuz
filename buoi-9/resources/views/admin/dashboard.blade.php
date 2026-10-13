<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">Khu vực quản trị</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="bg-white shadow-sm sm:rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 mb-3">Người dùng</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="text-left text-gray-500 border-b">
                                <th class="py-2 pe-4">Tên</th>
                                <th class="py-2 pe-4">Email</th>
                                <th class="py-2">Vai trò</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($users as $user)
                                <tr class="border-b border-gray-100">
                                    <td class="py-2 pe-4">{{ $user->name }}</td>
                                    <td class="py-2 pe-4">{{ $user->email }}</td>
                                    <td class="py-2">{{ $user->is_admin ? 'Admin' : 'Thành viên' }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-white shadow-sm sm:rounded-lg p-6">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-gray-900">Bài viết</h3>
                    <a href="{{ route('admin.articles.index') }}" class="text-sm text-indigo-600">Mở CRUD /admin/articles</a>
                </div>
                <ul class="space-y-2 text-sm text-gray-700">
                    @forelse ($articles as $article)
                        <li>
                            <a href="{{ route('articles.show', $article) }}" class="text-indigo-600">{{ $article->title }}</a>
                            — {{ $article->user->name ?? 'Ẩn danh' }}
                        </li>
                    @empty
                        <li>Chưa có bài viết.</li>
                    @endforelse
                </ul>
            </div>
        </div>
    </div>
</x-app-layout>
