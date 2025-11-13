import { IssueReportingCard } from "./feature-cards/issue-reporting-card";
import { AppointmentBookingCard } from "./feature-cards/appointment-booking-card";
import { SupportChatCard } from "./feature-cards/support-chat-card";
import { ServiceRecommendationCard } from "./feature-cards/service-recommendation-card";

export function Features() {
  return (
    <section id="features" className="w-full py-20 md:py-32 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">Your City Services, Simplified</h2>
            <p className="mt-4 text-muted-foreground md:text-lg">Everything you need to connect with Roxas City in one place.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <IssueReportingCard />
            <AppointmentBookingCard />
            <SupportChatCard />
            <ServiceRecommendationCard />
        </div>
      </div>
    </section>
  );
}
