import React from "react";

const IconCar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const IconWallet = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconMessage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconStar = ({ filled = false }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 shrink-0 text-cyan-400">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconApple = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
  </svg>
);

const IconPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-slate-950 p-1.5">
                <IconCar />
              </div>
              <span className="text-xl font-bold tracking-tight">RouteFlow</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Reviews</a>
              <a href="#download" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Download</a>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-full px-6 py-2 text-sm transition-colors">
                Get the App
              </button>
            </div>

            <button
              className="md:hidden p-2 text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800">
            <div className="px-4 pt-2 pb-6 space-y-4">
              <a href="#features" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white">Features</a>
              <a href="#testimonials" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white">Reviews</a>
              <a href="#download" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white">Download</a>
              <div className="pt-2">
                <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-full py-3 text-sm transition-colors">
                  Get the App
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
                <span className="flex h-2 w-2 rounded-full bg-cyan-500"></span>
                The ultimate driver app
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                Run Your Rides.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Own Your Earnings.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 mb-8 leading-relaxed max-w-xl">
                RouteFlow is the premium ride management app built specifically for the independent transportation driver. Stop paying fleet fees and take control of your schedule.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="h-14 px-6 bg-white hover:bg-slate-100 text-slate-950 rounded-xl flex items-center gap-3 justify-center transition-colors">
                  <IconApple />
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-semibold leading-none text-slate-500 mb-1">Download on the</div>
                    <div className="text-sm font-bold leading-none">App Store</div>
                  </div>
                </button>
                <button className="h-14 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 flex items-center gap-3 justify-center transition-colors">
                  <IconPlay />
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-semibold leading-none text-slate-400 mb-1">GET IT ON</div>
                    <div className="text-sm font-bold leading-none">Google Play</div>
                  </div>
                </button>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm text-slate-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Driver" className="w-full h-full object-cover opacity-80" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-0.5 text-cyan-400">
                    {[1, 2, 3, 4, 5].map((i) => <IconStar key={i} filled />)}
                  </div>
                  <span>Trusted by 5,000+ drivers</span>
                </div>
              </div>
            </div>

            <div className="relative lg:ml-auto">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-cyan-900/20 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                <img
                  src={`${import.meta.env.BASE_URL}images/routeflow-hero.png`}
                  alt="RouteFlow App Interface showing earnings and ride management for independent transportation drivers"
                  className="w-full h-auto object-cover relative z-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900 border-y border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything a solo driver needs</h2>
            <p className="text-lg text-slate-400">
              We stripped away the complex fleet management tools to build a sleek transportation driver app focused entirely on your daily workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <IconCar />,
                title: "Ride Management",
                body: "Organize your daily pickups, plot optimal routes, and manage your entire schedule from one intuitive dashboard. Say goodbye to scattered calendar events."
              },
              {
                icon: <IconWallet />,
                title: "Earnings Tracker",
                body: "A dedicated earnings tracker for drivers. View daily and weekly income breakdowns instantly so you always know exactly where your business stands."
              },
              {
                icon: <IconMessage />,
                title: "Quick SMS Updates",
                body: "Send professional driver SMS updates with a single tap. Notify clients when you're en route, arrived, or delayed without typing out manual messages while driving."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-950 rounded-2xl p-8 border border-slate-800 hover:border-cyan-500/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform p-3">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Independent Drivers */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Built exclusively for independent drivers.</h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Most dispatch apps are built for fleet operators watching dots on a map. RouteFlow is built for the person behind the wheel — giving you the pro-level tools to run your solo transportation business smoothly.
              </p>

              <ul className="space-y-4">
                {[
                  "No percentage cuts or hidden platform fees",
                  "Direct connection with your own private clients",
                  "Seamless Google & Apple Sign-In integration",
                  "Offline mode for when you lose cell service"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <IconCheck />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              <button className="mt-10 bg-white text-slate-950 hover:bg-slate-200 rounded-full px-8 py-4 text-lg font-semibold transition-colors">
                Start your 14-day free trial
              </button>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-full bg-cyan-500/5 border border-cyan-500/20 absolute -inset-4 blur-xl animate-pulse" />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-sm text-slate-400 font-medium">This Week's Earnings</div>
                    <div className="text-3xl font-bold mt-1 text-white">$1,845.00</div>
                  </div>
                  <div className="text-cyan-400 text-sm font-semibold bg-cyan-500/10 px-3 py-1 rounded-full">+12% vs last week</div>
                </div>

                <div className="space-y-4">
                  {[
                    { client: "Sarah Jenkins", route: "JFK Airport Dropoff", amount: "$120.00", time: "Today, 8:00 AM" },
                    { client: "Marcus Torres", route: "Downtown Corporate", amount: "$85.00", time: "Today, 11:30 AM" },
                    { client: "Elena Rostova", route: "EWR Airport Pickup", amount: "$145.00", time: "Yesterday, 4:15 PM" }
                  ].map((ride, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 p-2.5">
                          <IconCar />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{ride.client}</div>
                          <div className="text-xs text-slate-500">{ride.time} • {ride.route}</div>
                        </div>
                      </div>
                      <div className="font-bold text-cyan-400">{ride.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-900 border-y border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by solo operators</h2>
            <p className="text-lg text-slate-400">Join thousands of drivers who have upgraded their business workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "The quick SMS feature alone is worth it. One tap to let my airport pickups know I've arrived in the cell phone lot. No more texting and driving.",
                name: "David M.",
                role: "Executive Black Car Driver"
              },
              {
                quote: "Finally, a ride management app that doesn't treat me like an employee. It's just a pure utility to track my schedule and earnings. Brilliant.",
                name: "Lisa K.",
                role: "Independent Shuttle Operator"
              },
              {
                quote: "I ditched my messy spreadsheets. The earnings tracker for drivers shows exactly what I make per trip and per week. RouteFlow pays for itself.",
                name: "James T.",
                role: "Private Chauffeur"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-950 p-8 rounded-2xl border border-slate-800 relative">
                <div className="flex gap-1 mb-6 text-cyan-400">
                  {[1, 2, 3, 4, 5].map((s) => <IconStar key={s} filled />)}
                </div>
                <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="download" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-cyan-900/10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Download RouteFlow Free</h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Join thousands of independent transportation professionals who run their rides and own their earnings with RouteFlow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="h-16 px-8 bg-white hover:bg-slate-100 text-slate-950 rounded-xl flex items-center gap-3 justify-center w-full sm:w-auto transition-colors">
              <IconApple />
              <div className="text-left">
                <div className="text-[11px] uppercase font-semibold leading-none text-slate-500 mb-1">Download on the</div>
                <div className="text-base font-bold leading-none">App Store</div>
              </div>
            </button>
            <button className="h-16 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border border-slate-700 flex items-center gap-3 justify-center w-full sm:w-auto shadow-xl transition-colors">
              <IconPlay />
              <div className="text-left">
                <div className="text-[11px] uppercase font-semibold leading-none text-slate-400 mb-1">GET IT ON</div>
                <div className="text-base font-bold leading-none">Google Play</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center text-slate-950 p-1">
                <IconCar />
              </div>
              <span className="text-lg font-bold">RouteFlow</span>
            </div>

            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Contact Support</a>
            </div>

            <div className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} RouteFlow Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
