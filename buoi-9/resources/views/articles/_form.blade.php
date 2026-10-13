@csrf

<div>
    <label for="title" class="block text-sm font-medium text-gray-700">Tiêu đề</label>
    <input id="title" type="text" name="title" value="{{ old('title', $article->title ?? '') }}"
           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
    @error('title')
        <div class="text-red-600 text-sm mt-1">{{ $message }}</div>
    @enderror
</div>

<div class="mt-4">
    <label for="body" class="block text-sm font-medium text-gray-700">Nội dung</label>
    <textarea id="body" name="body" rows="8"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">{{ old('body', $article->body ?? '') }}</textarea>
    @error('body')
        <div class="text-red-600 text-sm mt-1">{{ $message }}</div>
    @enderror
</div>

<div class="mt-4">
    <label for="tags" class="block text-sm font-medium text-gray-700">Thẻ (tùy chọn)</label>
    <input id="tags" type="text" name="tags" value="{{ old('tags', $article->tags ?? '') }}"
           placeholder="laravel, validation"
           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
    @error('tags')
        <div class="text-red-600 text-sm mt-1">{{ $message }}</div>
    @enderror
</div>

<div class="mt-4">
    <label for="image" class="block text-sm font-medium text-gray-700">Ảnh minh họa (tùy chọn)</label>
    <input id="image" type="file" name="image" accept=".jpg,.jpeg,.png"
           class="mt-1 block w-full text-sm text-gray-700">
    <p class="text-xs text-gray-500 mt-1">jpg, jpeg hoặc png, tối đa 2048 KB.</p>
    @error('image')
        <div class="text-red-600 text-sm mt-1">{{ $message }}</div>
    @enderror
    @isset($article)
        @if ($article->image_path)
            <img src="{{ asset('storage/'.$article->image_path) }}" alt="Ảnh hiện tại" class="mt-3 rounded-md" width="220">
        @endif
    @endisset
</div>

<div class="mt-6 flex items-center gap-3">
    <button type="submit" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-500">
        Lưu
    </button>
    <a href="{{ route('articles.index') }}" class="text-sm text-gray-600 hover:text-gray-900">Hủy</a>
</div>
