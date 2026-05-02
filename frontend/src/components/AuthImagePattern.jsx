const SAMPLE_MESSAGES = [
  { id: 1, text: "Hey, did you check the new design?", time: "11:37 AM", mine: false },
  { id: 2, text: "Yep! Looks super clean. Shipping it today 🚀", time: "11:38 AM", mine: true },
  { id: 3, text: "Great! I'll prep the release notes.", time: "11:39 AM", mine: false },
];

const AuthImagePattern = ({ title, subtitle }) => {
    return (
    <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-b from-[#dfece3] to-[#b7d5c8] dark:from-[#1f2c34] dark:to-[#0b141a] p-12">
      {/* Decorative circles */}
      <div className="absolute -right-16 -top-16 size-40 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -left-10 bottom-10 size-32 rounded-full bg-white/10 blur-xl" />

      <div className="relative z-10 max-w-md w-full">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/70 text-sm font-semibold text-[#1f2c34] shadow">
            <span className="size-2 rounded-full bg-[#25D366]" />
            Fast, secure and synced
          </span>
          <h2 className="text-3xl font-bold text-[#1f2c34] dark:text-white mt-4">{title}</h2>
          <p className="text-[#1f2c34]/70 dark:text-white/80 mt-2">{subtitle}</p>
        </div>

        {/* Chat preview card */}
        <div className="bg-white/80 dark:bg-[#111b21] rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 backdrop-blur">
          <div className="px-6 py-5 border-b border-white/60 dark:border-white/10 flex items-center gap-3">
            <div className="size-10 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366] font-semibold">
              A
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1f2c34] dark:text-white">Amelia Clarke</p>
              <span className="text-xs text-[#1f2c34]/60 dark:text-white/60">typing…</span>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4 bg-[radial-gradient(circle_at_top,_rgba(37,211,102,0.08),_transparent_45%)] bg-[#f5f6f6] dark:bg-[#0b141a]">
            {SAMPLE_MESSAGES.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow ${
                    message.mine
                      ? "bg-gradient-to-b from-[#d9fdd3] to-[#c4ecbc] text-[#111b21]"
                      : "bg-white text-[#111b21]"
                  }`}
                >
                  <p>{message.text}</p>
                  <span className="text-[10px] block mt-1 text-[#111b21]/60">
                    {message.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-white/60 dark:border-white/10 bg-white/70 dark:bg-[#111b21]">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-[#1f2c34]/60">
                Write a message…
              </div>
              <div className="size-9 rounded-full bg-[#25D366] text-white flex items-center justify-center font-semibold">
                ⤴
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  };
  
  export default AuthImagePattern;