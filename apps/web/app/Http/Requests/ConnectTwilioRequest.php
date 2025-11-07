<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConnectTwilioRequest extends FormRequest
{
    public function authorize(): bool
    {
        $group = $this->route('group');
        return $group && $this->user()->can('update', $group);
    }

    public function rules(): array
    {
        return [
            'account_sid'         => ['required', 'string', 'starts_with:AC', 'min:10'],
            'incoming_phone_e164' => ['nullable', 'string', 'regex:/^\+\d{6,15}$/'],
            'subaccount_sid'      => ['nullable', 'string', 'starts_with:AC'],
            'incoming_phone_sid'  => ['nullable', 'string', 'starts_with:PN'],
        ];
    }
}
