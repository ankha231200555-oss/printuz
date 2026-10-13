<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $demo = User::updateOrCreate(
            ['email' => 'demo@huit.edu.vn'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('password123'),
                'is_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        $admin = User::updateOrCreate(
            ['email' => 'admin@huit.edu.vn'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        Article::updateOrCreate(
            ['title' => 'Giới thiệu Laravel Validation'],
            [
                'user_id' => $demo->id,
                'body' => 'Nội dung mẫu dài hơn mười ký tự để minh họa bài viết đã được xác thực bằng Form Request.',
                'tags' => 'laravel, validation',
            ]
        );

        Article::updateOrCreate(
            ['title' => 'Middleware và phân quyền'],
            [
                'user_id' => $admin->id,
                'body' => 'Bài viết của admin để kiểm tra chỉ tác giả mới thấy nút sửa và xóa trên giao diện.',
                'tags' => 'middleware, policy',
            ]
        );
    }
}
