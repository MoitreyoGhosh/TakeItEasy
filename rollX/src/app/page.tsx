import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Edit, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="container flex flex-col items-center text-center py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Smart, Seamless Attendance Tracking
          </h1>
          <p className="mt-6 max-w-[700px] mx-auto text-muted-foreground md:text-xl">
            Introducing{" "}
            <span className="font-semibold text-primary">takeiteasy</span>, the
            modern solution for educators and organizers. Effortlessly manage
            groups, track attendance in real-time, and focus on what truly
            matters.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/signUp">Get Started for Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 bg-muted/40">
        <div className="container">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-tight sm:text-4xl md:text-5xl">
              Why Choose takeiteasy?
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Our platform is designed to be powerful yet simple, giving you
              full control without the headache.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:grid-cols-3 mt-16">
            <div className="flex flex-col items-center text-center gap-2 p-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Effortless Group Management</h3>
              <p className="text-sm text-muted-foreground">
                Create persistent groups for classes or events. Invite members
                with a simple code and reuse the group all semester.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 p-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Instant & Secure Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Launch on-demand sessions with secure, time-sensitive codes and
                see attendance results populate in real-time.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 p-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
                <Edit className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Complete Admin Control</h3>
              <p className="text-sm text-muted-foreground">
                Manually edit attendance records for exceptions, handle
                latecomers gracefully, and export final reports to CSV with
                ease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="container py-20 md:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-bold text-3xl leading-tight sm:text-4xl md:text-5xl">
            Built for You
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Whether you&apos;re leading a classroom or organizing an event, our
            platform adapts to your needs.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle>For Hosts</CardTitle>
              <CardDescription>
                (Teachers, Organizers, Trainers)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                As a Host, you are in complete control. Create a group, share a
                simple join code, and launch attendance sessions whenever you
                need. Monitor attendance in real-time and manage your records
                effortlessly.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle>For Participants</CardTitle>
              <CardDescription>(Students, Attendees, Members)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                As a Participant, your experience is simple. Join a group with a
                code from your host. When it&apos;s time, open the app, enter the
                session code, and you&apos;re marked present. No more paper sheets or
                manual roll calls.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
