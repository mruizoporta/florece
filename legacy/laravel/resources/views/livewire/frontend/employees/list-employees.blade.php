<div class="row">

    @foreach ($employees as $employee)
        <div class="col-md-3 bottommargin">
            <div class="team">
                <div class="team-image">
                    <img src="{{ asset($this->medium('storage/employees/', $employee->image)) }}" alt="{{ $employee->name }}" style="border-radius: 50%" width="128px" loading="lazy">
                    <div class="bg-overlay">
                        <div
                            class="bg-overlay-content p-2 flex-column-reverse justify-content-between align-items-center">
                            <div class="d-flex mb-3" data-hover-animate="fadeInUp" data-hover-animate-out="fadeOutDown"
                                data-hover-speed="400" data-hover-parent=".team">
                                @foreach ($employee->socials as $social)
                                    <a href="{{ $social->pivot->href }}" target="_blank" class="social-icon si-rounded si-colored si-small si-{{ strtolower($social->name) }}" title="{{ $social->name }}">
                                        <i class="icon-{{ $social->icon }}"></i>
                                        <i class="icon-{{ $social->icon }}"></i>
                                    </a>
                                @endforeach
                            </div>
                            <a href="#" class="button button-large button-color m-0 w-100 text-center"
                                data-hover-animate="fadeInDown" data-hover-animate-out="fadeOutUp"
                                data-hover-speed="400" data-hover-parent=".team">Agendarme</a>
                        </div>
                        <div class="bg-overlay-bg dark" data-hover-animate="fadeIn" data-hover-speed="400"
                            data-hover-parent=".team"></div>
                    </div>
                </div>
                <div class="team-desc">
                    <div class="team-title">
                        <h4>{{ $employee->name }}</h4>
                        <span style="color: #{{ $titles_color }}">
                            {{ $employee->description }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    @endforeach

</div>
