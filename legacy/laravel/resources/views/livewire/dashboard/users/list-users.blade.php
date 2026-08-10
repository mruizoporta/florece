<div>

    <div class="shearly-table-wrap">
        <table class="w-full text-sm">
            <thead>
                <tr class="bg-brand-warm/60 border-b border-brand-blush-light/60">
                    <th scope="col" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted w-14">#</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">Nombre</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">Correo</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">Roles</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted whitespace-nowrap">Fecha de registro</th>
                    <th scope="col" class="px-3 py-4 pr-5 text-right text-xs font-semibold uppercase tracking-wider text-brand-ink-muted whitespace-nowrap">Acción</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-brand-blush-light/40">
                @forelse($users as $user)
                    <tr wire:key="user-row-{{ $user->id }}"
                        class="transition-colors duration-150 hover:bg-brand-rose-mist/50">
                        <td class="px-5 py-4 text-xs text-brand-ink-muted/60 tabular-nums font-mono whitespace-nowrap">
                            {{ $user->id }}
                        </td>
                        <td class="px-3 py-4 font-medium text-brand-ink whitespace-nowrap max-w-[160px] truncate" title="{{ $user->name }}">
                            {{ $user->name }}
                        </td>
                        <td class="px-3 py-4 text-brand-ink-muted whitespace-nowrap max-w-[200px] truncate" title="{{ $user->email }}">
                            {{ $user->email }}
                        </td>
                        <td class="px-3 py-4">
                            <div class="flex flex-wrap gap-1.5">
                                @foreach($user->roles as $role)
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium
                                                 bg-brand-primary/10 text-brand-primary-dark ring-1 ring-brand-primary/15 whitespace-nowrap">
                                        {{ $role->name }}
                                    </span>
                                @endforeach
                            </div>
                        </td>
                        <td class="px-3 py-4 text-brand-ink-muted whitespace-nowrap tabular-nums">
                            {{ $user->created_at->format('d-m-Y') }}
                        </td>
                        <td class="px-3 py-4 pr-5 text-right whitespace-nowrap">
                            <button type="button"
                                    wire:click="resetPassword({{ $user->id }})"
                                    wire:confirm="¿Restablecer la contraseña de este usuario a *1234*?"
                                    title="Restablecer contraseña"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                                           text-brand-ink-muted border border-brand-blush-light/80 bg-white
                                           hover:text-brand-primary-dark hover:border-brand-primary/30 hover:bg-brand-primary/5
                                           active:scale-[0.98] transition-all duration-150">
                                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                          d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/>
                                </svg>
                                <span class="hidden sm:inline">Restablecer</span>
                            </button>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="px-5 py-16 text-center">
                            <div class="flex flex-col items-center gap-3">
                                <span class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-primary/8 text-brand-ink-muted/40">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.813-2.38M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
                                    </svg>
                                </span>
                                <p class="text-sm text-brand-ink-muted">
                                    Sin resultados
                                    @if($this->search)
                                        para <strong class="text-brand-ink">{{ $this->search }}</strong>
                                    @endif
                                </p>
                            </div>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4 px-1">
        {{ $users->links() }}
    </div>

</div>
