<nav x-data="{ open: false }" class="bg-white border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex">
                <div class="shrink-0 flex items-center">
                    <a href="{{ route('home') }}" class="font-semibold text-gray-800">
                        Buổi 9
                    </a>
                </div>

                <div class="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                    <x-nav-link :href="route('home')" :active="request()->routeIs('home')">
                        Trang chủ
                    </x-nav-link>
                    <x-nav-link :href="route('articles.index')" :active="request()->routeIs('articles.index') || request()->routeIs('articles.show')">
                        Bài viết
                    </x-nav-link>
                    @auth
                        <x-nav-link :href="route('articles.create')" :active="request()->routeIs('articles.create')">
                            Viết bài
                        </x-nav-link>
                        <x-nav-link :href="route('dashboard')" :active="request()->routeIs('dashboard')">
                            {{ __('Dashboard') }}
                        </x-nav-link>
                        @can('access-admin')
                            <x-nav-link :href="route('admin.dashboard')" :active="request()->routeIs('admin.*')">
                                Quản trị
                            </x-nav-link>
                        @endcan
                    @endauth
                </div>
            </div>

            <div class="hidden sm:flex sm:items-center sm:ms-6 gap-3">
                @auth
                    <span class="text-sm text-gray-600">{{ Auth::user()->name }}</span>
                    <a href="{{ route('profile.edit') }}" class="text-sm text-gray-600 hover:text-gray-900">Hồ sơ</a>
                    <form method="POST" action="{{ route('logout') }}" class="inline">
                        @csrf
                        <button type="submit" class="inline-flex items-center px-3 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700">
                            Đăng xuất
                        </button>
                    </form>
                @endauth
                @guest
                    <a href="{{ route('login') }}" class="text-sm text-gray-600 hover:text-gray-900">Đăng nhập</a>
                    <a href="{{ route('register') }}" class="inline-flex items-center px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-500">Đăng ký</a>
                @endguest
            </div>

            <div class="-me-2 flex items-center sm:hidden">
                <button @click="open = ! open" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out">
                    <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                        <path x-show="!open" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        <path x-show="open" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <div x-show="open" x-cloak class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
            <x-responsive-nav-link :href="route('home')" :active="request()->routeIs('home')">
                Trang chủ
            </x-responsive-nav-link>
            <x-responsive-nav-link :href="route('articles.index')" :active="request()->routeIs('articles.index')">
                Bài viết
            </x-responsive-nav-link>
            @auth
                <x-responsive-nav-link :href="route('articles.create')" :active="request()->routeIs('articles.create')">
                    Viết bài
                </x-responsive-nav-link>
                <x-responsive-nav-link :href="route('dashboard')" :active="request()->routeIs('dashboard')">
                    {{ __('Dashboard') }}
                </x-responsive-nav-link>
                @can('access-admin')
                    <x-responsive-nav-link :href="route('admin.dashboard')" :active="request()->routeIs('admin.*')">
                        Quản trị
                    </x-responsive-nav-link>
                @endcan
            @endauth
            @guest
                <x-responsive-nav-link :href="route('login')">Đăng nhập</x-responsive-nav-link>
                <x-responsive-nav-link :href="route('register')">Đăng ký</x-responsive-nav-link>
            @endguest
        </div>

        @auth
            <div class="pt-4 pb-1 border-t border-gray-200">
                <div class="px-4">
                    <div class="font-medium text-base text-gray-800">{{ Auth::user()->name }}</div>
                    <div class="font-medium text-sm text-gray-500">{{ Auth::user()->email }}</div>
                </div>
                <div class="mt-3 space-y-1">
                    <x-responsive-nav-link :href="route('profile.edit')">Hồ sơ</x-responsive-nav-link>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button type="submit" class="block w-full text-start ps-3 pe-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50">
                            Đăng xuất
                        </button>
                    </form>
                </div>
            </div>
        @endauth
    </div>
</nav>
