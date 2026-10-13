<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">Bài viết</h2>
            @auth
                <a href="{{ route('articles.create') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md">Viết bài</a>
            @endauth
        </div>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            @if ($articles->isEmpty())
                <div class="bg-white shadow-sm sm:rounded-lg p-6 text-gray-600">
                    Chưa có bài viết nào.
                </div>
            @else
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    @foreach ($articles as $article)
                        <article class="bg-white shadow-sm sm:rounded-lg overflow-hidden flex flex-col">
                            @if ($article->image_path)
                                <img src="{{ asset('storage/'.$article->image_path) }}" alt="Ảnh minh họa" class="h-44 w-full object-cover">
                            @else
                                <div class="h-44 bg-indigo-50 flex items-center justify-center text-indigo-300 text-sm">Không có ảnh</div>
                            @endif
                            <div class="p-5 flex flex-col gap-2 flex-1">
                                <h3 class="font-semibold text-lg text-gray-900">
                                    <a href="{{ route('articles.show', $article) }}" class="hover:text-indigo-600">{{ $article->title }}</a>
                                </h3>
                                <p class="text-sm text-gray-600 line-clamp-3">{{ $article->body }}</p>
                                <p class="text-xs text-gray-500 mt-auto">
                                    {{ $article->user->name ?? 'Ẩn danh' }}
                                    · {{ $article->created_at->format('d/m/Y H:i') }}
                                </p>
                            </div>
                        </article>
                    @endforeach
                </div>
                <div class="mt-6">{{ $articles->links() }}</div>
            @endif
        </div>
    </div>
</x-app-layout>
