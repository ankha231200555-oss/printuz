<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">{{ $article->title }}</h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white shadow-sm sm:rounded-lg p-6 space-y-4">
                @if ($article->image_path)
                    <img src="{{ asset('storage/'.$article->image_path) }}" alt="Ảnh minh họa" class="rounded-md max-w-full" width="640">
                @endif

                <p class="whitespace-pre-line text-gray-800">{{ $article->body }}</p>

                @if ($article->tags)
                    <p class="text-sm text-gray-500">Thẻ: {{ $article->tags }}</p>
                @endif

                <p class="text-sm text-gray-600">
                    Tác giả: {{ $article->user->name ?? 'Ẩn danh' }}
                    | Ngày tạo: {{ $article->created_at->format('d/m/Y H:i') }}
                </p>

                <div class="flex items-center gap-4">
                    @can('update', $article)
                        <a href="{{ route('articles.edit', $article) }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md">Sửa</a>
                    @endcan

                    @can('delete', $article)
                        <form action="{{ route('articles.destroy', $article) }}" method="POST" class="inline">
                            @csrf
                            @method('DELETE')
                            <button type="submit" onclick="return confirm('Bạn có chắc chắn muốn xóa?')" class="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded-md">
                                Xóa
                            </button>
                        </form>
                    @endcan
                </div>

                @cannot('update', $article)
                    <p class="text-sm text-gray-500">Bạn không phải tác giả của bài viết này.</p>
                @endcannot

                <a href="{{ route('articles.index') }}" class="inline-block text-sm text-indigo-600">← Danh sách bài viết</a>
            </div>
        </div>
    </div>
</x-app-layout>
