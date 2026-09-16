'use client';

import Image from "next/image";
import posthog from "posthog-js";

const ExploreBtn = () => {
    const handleExploreEventsClick = () => {
        console.log("Events btn clicked");
        if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
            posthog.capture("explore_events_clicked");
        }
    };

    return (
        <button type='button' id='explore-btn' className="mt-7 mx-auto" onClick={handleExploreEventsClick}>
            <a href="#events">
                Explore Events
                <Image src='/icons/arrow-down.svg' alt="arrow-down" width={24} height={24}/>
            </a>
        </button>
    )
}

export default ExploreBtn