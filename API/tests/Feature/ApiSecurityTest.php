<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureTokenType;
use App\Models\Customer;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** CORS allow-list, security headers, and "right token for the right API". */
class ApiSecurityTest extends TestCase
{
    public function test_responses_carry_security_headers(): void
    {
        $response = $this->get('/api/ping');

        $response->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'no-referrer');
        $this->assertFalse($response->headers->has('X-Powered-By'));
    }

    public function test_cors_allows_palengkey_origins_only(): void
    {
        $this->get('/api/ping', ['Origin' => 'https://localhost'])
            ->assertHeader('Access-Control-Allow-Origin', 'https://localhost');

        $this->get('/api/ping', ['Origin' => 'https://evil.example'])
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    public function test_guests_get_json_401_not_a_crash(): void
    {
        $this->get('/api/admin/settings')->assertStatus(401)->assertJson(['message' => 'Unauthenticated.']);
        $this->get('/api/customer/orders')->assertStatus(401);
    }

    /** @return array<string, array{string, class-string, int}> */
    public static function tokenTypes(): array
    {
        return [
            'customer on customer API' => ['customer', Customer::class, 200],
            'admin on customer API' => ['customer', User::class, 403],
            'rider on customer API' => ['customer', Rider::class, 403],
            'admin on admin API' => ['admin', User::class, 200],
            'customer on admin API' => ['admin', Customer::class, 403],
            'rider on admin API' => ['admin', Rider::class, 403],
        ];
    }

    #[DataProvider('tokenTypes')]
    public function test_tokens_only_work_on_their_own_api(string $type, string $account, int $status): void
    {
        $request = Request::create('/x');
        $request->setUserResolver(fn () => new $account);

        $response = (new EnsureTokenType)->handle($request, fn () => response()->json(['ok' => true]), $type);

        $this->assertSame($status, $response->getStatusCode());
    }
}
