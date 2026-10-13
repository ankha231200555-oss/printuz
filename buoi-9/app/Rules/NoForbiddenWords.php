<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoForbiddenWords implements ValidationRule
{
    /**
     * Cấm một số từ nhạy cảm xuất hiện trong tiêu đề.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $forbidden = ['test', 'spam', 'xxx'];
        $lower = mb_strtolower((string) $value, 'UTF-8');

        foreach ($forbidden as $word) {
            if (str_contains($lower, $word)) {
                $fail('Trường :attribute chứa từ không được phép: "'.$word.'".');
            }
        }
    }
}
