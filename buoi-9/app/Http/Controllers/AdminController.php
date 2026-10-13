<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\User;
use Illuminate\View\View;

class AdminController extends Controller
{
    public function dashboard(): View
    {
        $users = User::query()->orderBy('name')->get();
        $articles = Article::query()->with('user')->latest()->get();

        return view('admin.dashboard', compact('users', 'articles'));
    }
}
