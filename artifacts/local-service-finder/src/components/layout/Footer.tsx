import React from "react";
import { Link } from "wouter";
import { MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-background">
                Local<span className="text-primary">Finder</span>
              </span>
            </Link>
            <p className="text-muted text-sm max-w-xs">
              Connecting you with trusted, verified local professionals for all your home and personal needs.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">For Customers</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/services" className="hover:text-primary transition-colors">Find a Professional</Link></li>
              <li><Link href="/how-it-works" className="hover:text-primary transition-colors">How it Works</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Register</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">For Professionals</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/register?role=provider" className="hover:text-primary transition-colors">Join as a Pro</Link></li>
              <li><Link href="/provider/success" className="hover:text-primary transition-colors">Success Stories</Link></li>
              <li><Link href="/provider/guidelines" className="hover:text-primary transition-colors">Community Guidelines</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Support</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-muted/20 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} LocalFinder Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>Made with precision.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
