
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BarChart3, Calendar, DollarSign, Users, Shield, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const features = [
    {
      icon: BarChart3,
      title: "Academic Results",
      description: "Track grades, CATs, exams, and academic progress across all subjects and semesters"
    },
    {
      icon: Calendar,
      title: "Attendance Monitoring",
      description: "Real-time attendance tracking for lectures, tutorials, and practical sessions"
    },
    {
      icon: DollarSign,
      title: "Financial Management",
      description: "Manage school fees, payments, and financial records - all amounts in KSh"
    },
    {
      icon: Users,
      title: "Parent-Student Connect",
      description: "Parents can monitor their child's university progress and academic performance"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your academic and financial data is protected with enterprise-grade security"
    },
    {
      icon: Star,
      title: "Real-time Updates",
      description: "Get instant notifications about grades, attendance, and university activities"
    }
  ];

  const testimonials = [
    {
      name: "Grace Wanjiku",
      role: "Parent of Business Student",
      content: "UEAB Portal has made it so easy to track my daughter's progress at university. I love the real-time updates!"
    },
    {
      name: "David Kiprotich",
      role: "Parent of Computer Science Student",
      content: "The financial tracking feature is excellent. I can see exactly where every shilling goes for my son's education."
    },
    {
      name: "Mary Achieng",
      role: "Parent of Nursing Student",
      content: "Managing my child's university activities was complex until I found UEAB Portal. Now everything is organized!"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">UEAB Portal</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            University of Eastern Africa, Baraton
            <span className="text-primary block mt-2">Student Progress Portal</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            UEAB Portal is the complete platform for parents and students to track academic results, monitor attendance, 
            manage university finances, and stay engaged with your educational journey.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link to="/signup" className="flex items-center">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for University Success
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed specifically for UEAB students and parents to monitor and support academic success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">3K+</div>
              <div className="text-lg opacity-90">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2K+</div>
              <div className="text-lg opacity-90">Parent Accounts</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">12</div>
              <div className="text-lg opacity-90">Faculties</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-lg opacity-90">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by UEAB Families
            </h2>
            <p className="text-lg text-gray-600">
              See what other parents are saying about UEAB Portal
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join UEAB students and parents who are already using our portal to stay connected with university education.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link to="/signup" className="flex items-center">
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">UEAB Portal</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 University of Eastern Africa, Baraton. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
