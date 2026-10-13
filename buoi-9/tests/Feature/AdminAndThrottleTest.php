<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAndThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_area_is_blocked_for_guests_and_members(): void
    {
        $this->get(route('admin.dashboard'))->assertRedirect(route('login'));

        $member = User::factory()->create();
        $this->actingAs($member)->get(route('admin.dashboard'))->assertForbidden();
        $this->actingAs($member)->get(route('admin.articles.index'))->assertForbidden();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertSee('Khu vực quản trị')
            ->assertSee('Quản trị');
    }

    public function test_public_info_api_is_throttled_at_sixty_per_minute(): void
    {
        $this->getJson('/api/public-info')
            ->assertOk()
            ->assertJson(['status' => 'ok']);
    }

    public function test_throttle_demo_returns_429_after_five_requests(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->get(route('throttle.demo'))->assertOk();
        }

        $this->get(route('throttle.demo'))->assertStatus(429);
    }

    public function test_login_route_is_throttled(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email' => 'khong-ton-tai@huit.edu.vn',
                'password' => 'sai-mat-khau',
            ])->assertStatus(302);
        }

        $this->post('/login', [
            'email' => 'khong-ton-tai@huit.edu.vn',
            'password' => 'sai-mat-khau',
        ])->assertStatus(429);
    }
}
