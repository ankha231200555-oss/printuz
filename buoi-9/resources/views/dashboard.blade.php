<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900 space-y-3">
                    <p>Xin chào {{ Auth::user()->name }}. Bạn đã đăng nhập.</p>
                    <div class="flex flex-wrap gap-3">
                        <a href="{{ route('articles.index') }}" class="text-indigo-600">Danh sách bài viết</a>
                        <a href="{{ route('articles.create') }}" class="text-indigo-600">Viết bài</a>
                        @can('access-admin')
                            <a href="{{ route('admin.dashboard') }}" class="text-indigo-600">Khu quản trị</a>
                        @endcan
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
