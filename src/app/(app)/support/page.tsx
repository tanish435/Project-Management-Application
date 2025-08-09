'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Clock,
  MapPin,
  Send,
  BookOpen,
  Bug,
  Lightbulb,
  Shield,
  Zap,
  Users,
  Star,
  CheckCircle,
  ExternalLink
} from 'lucide-react'

const SupportPage = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Support form submitted')
  }

  const faqs = [
    {
      question: "How do I create my first board?",
      answer: "To create your first board, click the 'Create' button in the navbar, choose a template or start from scratch, give your board a name, select a background color, and click 'Create Board'. You'll be redirected to your new board where you can start adding lists and cards."
    },
    {
      question: "How do I invite team members to my board?",
      answer: "Open your board, click the 'Share' button in the top-right corner, enter the email addresses of the people you want to invite, set their permission level (view, edit, or admin), and click 'Send Invites'. They'll receive an email invitation to join your board."
    },
    {
      question: "Can I change my username after creating an account?",
      answer: "Yes! Go to your Profile page by clicking on your avatar in the navbar, then select 'Profile'. You can edit your username, but make sure to choose one that's available. Changes are saved automatically."
    },
    {
      question: "How do I organize my boards?",
      answer: "You can organize boards by starring your favorites (they'll appear in the 'Starred' dropdown), using descriptive names, and applying consistent color coding. Recently accessed boards appear in the 'Recent' dropdown for quick access."
    },
    {
      question: "What happens if I accidentally delete a card or list?",
      answer: "Currently, deleted cards and lists cannot be recovered, so please be careful when deleting content. We recommend double-checking before confirming any deletions. We're working on an 'undo' feature for future releases."
    },
    {
      question: "Is there a mobile app available?",
      answer: "While we don't have a dedicated mobile app yet, our web application is fully responsive and works great on mobile browsers. You can add it to your home screen for a native app-like experience."
    },
    {
      question: "How can I change the theme of the application?",
      answer: "Click on your avatar in the navbar, select the theme option, and choose between Light, Dark, or System (which follows your device's theme). The change will be applied immediately across the application."
    },
    {
      question: "What's the maximum file size for avatar uploads?",
      answer: "Avatar images can be up to 5MB in size. We support JPG, PNG, and GIF formats. For best results, use a square image with at least 400x400 pixels resolution."
    }
  ]

  const resources = [
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Comprehensive guides and tutorials",
      link: "/docs"
    },
    {
      icon: Zap,
      title: "Getting Started",
      description: "Quick start guide for new users",
      link: "/getting-started"
    },
    {
      icon: Users,
      title: "Community Forum",
      description: "Connect with other users and share tips",
      link: "/community"
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Learn about our security practices",
      link: "/security"
    }
  ]

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Support Center</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're here to help you get the most out of your experience. Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">24h</span>
              </div>
              <p className="text-sm text-muted-foreground">Average Response Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">4.9/5</span>
              </div>
              <p className="text-sm text-muted-foreground">Support Satisfaction</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">99.8%</span>
              </div>
              <p className="text-sm text-muted-foreground">Issue Resolution Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Additional Resources */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((resource, index) => {
              const IconComponent = resource.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
                      <IconComponent className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="group">
                      Learn More
                      <ExternalLink className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Status and Location */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Application</span>
                <Badge variant="default" className="bg-green-500">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Database</span>
                <Badge variant="default" className="bg-green-500">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>File Upload</span>
                <Badge variant="default" className="bg-green-500">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Email Service</span>
                <Badge variant="default" className="bg-green-500">Operational</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View Status Page
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Our Offices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">Headquarters</h4>
                <p className="text-sm text-muted-foreground">
                  123 Innovation Drive<br />
                  San Francisco, CA 94107<br />
                  United States
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Support Hours</h4>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                  Saturday - Sunday: 10:00 AM - 4:00 PM PST
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Still Need Help?</h3>
            <p className="mb-6 opacity-90">
              Our support team is standing by to help you succeed. Don't hesitate to reach out!
            </p>
            <Button size="lg" variant="secondary">
              Contact Support Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SupportPage