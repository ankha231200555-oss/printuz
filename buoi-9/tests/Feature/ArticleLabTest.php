<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ArticleLabTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_articles_but_cannot_create(): void
    {
        $article = Article::factory()->create();

        $this->get(route('articles.index'))
            ->assertOk()
            ->assertSee($article->title)
            ->assertSee('Đăng nhập')
            ->assertSee('Đăng ký')
            ->assertDontSee('Đăng xuất');

        $this->get(route('articles.show', $article))
            ->assertOk()
            ->assertSee('Bạn không phải tác giả của bài viết này.');

        $this->get(route('articles.create'))
            ->assertRedirect(route('login'));
    }

    public function test_store_rejects_invalid_data_and_keeps_old_input(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->from(route('articles.create'))
            ->post(route('articles.store'), [
                'title' => '',
                'body' => 'ngan',
                'tags' => 'laravel',
            ]);

        $response->assertRedirect(route('articles.create'));
        $response->assertSessionHasErrors(['title', 'body']);
        $response->assertSessionHasInput('body', 'ngan');
        $response->assertSessionHasInput('tags', 'laravel');
        $this->assertDatabaseCount('articles', 0);
    }

    public function test_store_rejects_forbidden_words_and_duplicate_titles(): void
    {
        $user = User::factory()->create();
        Article::factory()->create(['title' => 'Tieu de da co']);

        $this->actingAs($user)
            ->from(route('articles.create'))
            ->post(route('articles.store'), [
                'title' => 'Bai viet spam moi',
                'body' => 'Noi dung du dai de hop le.',
            ])
            ->assertSessionHasErrors('title');

        $this->actingAs($user)
            ->from(route('articles.create'))
            ->post(route('articles.store'), [
                'title' => 'Tieu de da co',
                'body' => 'Noi dung du dai de hop le.',
            ])
            ->assertSessionHasErrors('title');
    }

    public function test_author_can_create_article_with_optional_image(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('articles.store'), [
                'title' => 'Bai viet hop le',
                'body' => 'Noi dung du dai de vuot qua muoi ky tu.',
                'tags' => 'demo, laravel',
                'image' => UploadedFile::fake()->image('cover.jpg'),
            ])
            ->assertRedirect(route('articles.index'))
            ->assertSessionHas('success');

        $article = Article::query()->first();
        $this->assertNotNull($article);
        $this->assertSame($user->id, $article->user_id);
        $this->assertSame('demo, laravel', $article->tags);
        Storage::disk('public')->assertExists($article->image_path);

        $this->get(route('articles.show', $article))
            ->assertOk()
            ->assertSee('Sửa')
            ->assertSee('Xóa')
            ->assertSee('storage/'.$article->image_path, false);
    }

    public function test_store_rejects_non_image_upload(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('articles.create'))
            ->post(route('articles.store'), [
                'title' => 'Bai viet kem file sai',
                'body' => 'Noi dung du dai de hop le.',
                'image' => UploadedFile::fake()->create('tai-lieu.pdf', 100, 'application/pdf'),
            ])
            ->assertSessionHasErrors('image');
    }

    public function test_only_author_can_update_or_delete(): void
    {
        Storage::fake('public');
        $author = User::factory()->create();
        $other = User::factory()->create();
        $article = Article::factory()->create([
            'user_id' => $author->id,
            'title' => 'Tieu de giu nguyen',
            'image_path' => 'articles/old.jpg',
        ]);
        Storage::disk('public')->put('articles/old.jpg', 'old');

        $this->actingAs($other)->get(route('articles.edit', $article))->assertForbidden();
        $this->actingAs($other)->put(route('articles.update', $article), [
            'title' => 'Tieu de bi danh cap',
            'body' => 'Noi dung khong duoc phep sua.',
        ])->assertForbidden();
        $this->actingAs($other)->delete(route('articles.destroy', $article))->assertForbidden();

        $this->actingAs($other)->get(route('articles.show', $article))
            ->assertOk()
            ->assertDontSee('>Sửa<', false)
            ->assertSee('Bạn không phải tác giả của bài viết này.');

        $this->actingAs($author)
            ->put(route('articles.update', $article), [
                'title' => 'Tieu de giu nguyen',
                'body' => 'Noi dung da duoc cap nhat boi tac gia.',
                'image' => UploadedFile::fake()->image('moi.png'),
            ])
            ->assertRedirect(route('articles.show', $article));

        $article->refresh();
        $this->assertSame('Noi dung da duoc cap nhat boi tac gia.', $article->body);
        Storage::disk('public')->assertMissing('articles/old.jpg');
        Storage::disk('public')->assertExists($article->image_path);

        $this->actingAs($author)
            ->delete(route('articles.destroy', $article))
            ->assertRedirect(route('articles.index'));

        $this->assertDatabaseMissing('articles', ['id' => $article->id]);
    }

    public function test_navigation_changes_with_auth_state(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('articles.index'))
            ->assertOk()
            ->assertSee('Đăng xuất')
            ->assertSee('Viết bài')
            ->assertDontSee('Đăng ký');
    }
}
