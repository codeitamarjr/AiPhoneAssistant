<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class UsageWebController extends Controller
{
    public function index()
    {
        return Inertia::render('Usage/Index');
    }
}
