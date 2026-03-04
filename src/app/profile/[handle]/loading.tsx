function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`h-3 rounded-[2px] bg-sand-4 ${className}`} />;
}

function SkeletonSkillCard() {
  return (
    <article className="border border-sand-4 bg-sand-2 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-5 w-20" />
      </div>
      <SkeletonLine className="mt-2 h-3 w-full" />
      <SkeletonLine className="mt-2 h-3 w-5/6" />
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-sand-4 pt-2">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-3 w-16" />
      </div>
    </article>
  );
}

function SkeletonSubMetricsPanel() {
  return (
    <section className="size-full rounded-[2px] border-2 border-sand-4 bg-sand-2 p-2">
      <div className="flex h-full flex-col gap-2">
        <div className="h-[50px] rounded-[2px] border border-sand-4 bg-sand-1 p-2">
          <SkeletonLine className="h-full w-28" />
        </div>
        <div className="flex flex-col gap-4 border border-sand-4 bg-sand-1 p-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <SkeletonLine className="h-3 w-32" />
              <SkeletonLine className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkeletonHypothesisCard() {
  return (
    <article className="border border-sand-4 bg-sand-1 p-3">
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="mt-2 h-4 w-5/6" />
      <div className="mt-2 h-px bg-sand-5" />
      <SkeletonLine className="mt-2 h-3 w-2/3" />
      <div className="mt-2 flex items-center gap-3">
        <SkeletonLine className="h-3 w-12" />
        <SkeletonLine className="h-3 w-12" />
      </div>
    </article>
  );
}

export default function ProfileLoading() {
  return (
    <main className="w-full bg-sand-3 px-2 pt-0 pb-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading profile</span>
      <div className="flex w-full flex-col gap-2 animate-pulse">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-2">
            <section className="grid items-start gap-2 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[446px_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-2">
                <section className="w-full min-h-[545px] rounded-[2px] border-2 border-sand-4 bg-sand-2 p-4">
                  <div className="flex h-full flex-col gap-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="size-16 shrink-0 rounded-[2px] border border-sand-4 bg-sand-4" />
                        <div className="flex min-w-0 flex-col gap-2">
                          <SkeletonLine className="h-5 w-36" />
                          <SkeletonLine className="h-4 w-28" />
                        </div>
                      </div>
                      <SkeletonLine className="h-7 w-20" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <SkeletonLine className="h-4 w-full" />
                      <SkeletonLine className="h-4 w-11/12" />
                      <SkeletonLine className="h-4 w-4/5" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="flex h-[90px] flex-col gap-2 border border-sand-4 bg-sand-1 p-3">
                          <SkeletonLine className="h-6 w-16" />
                          <SkeletonLine className="h-3 w-20" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <SkeletonLine className="h-3 w-20" />
                      <div className="flex items-center gap-3">
                        <SkeletonLine className="h-3 w-14" />
                        <SkeletonLine className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </section>

                <SkeletonSubMetricsPanel />
                <SkeletonSubMetricsPanel />
              </div>

              <section className="size-full rounded-[2px] border-2 border-sand-4 bg-sand-2 p-3">
                <div className="flex flex-col gap-3">
                  <div className="flex h-[50px] items-center rounded-[2px] border border-sand-4 bg-sand-1 p-2">
                    <SkeletonLine className="h-4 w-40" />
                  </div>

                  <div className="border border-sand-4 bg-sand-1 p-3">
                    <SkeletonLine className="h-5 w-36" />
                    <SkeletonLine className="mt-2 h-3 w-full" />
                    <SkeletonLine className="mt-2 h-3 w-4/5" />
                  </div>

                  <div className="flex flex-col gap-4 border border-sand-4 bg-sand-1 p-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <SkeletonLine className="h-3 w-28" />
                          <SkeletonLine className="h-4 w-12" />
                        </div>
                        <div className="h-3 border border-sand-4 bg-sand-2 p-px">
                          <div className="h-full w-2/3 rounded-[2px] bg-sand-4" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <section className="rounded-[2px] border-2 border-sand-4 bg-sand-2 p-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex h-[50px] items-center justify-between rounded-[2px] border border-sand-4 bg-sand-1 p-2">
                        <SkeletonLine className="h-4 w-32" />
                        <SkeletonLine className="h-4 w-16" />
                      </div>
                      <div className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <SkeletonHypothesisCard key={idx} />
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </section>
            </section>
          </div>

          <aside className="flex min-h-[1320px] flex-col gap-3 border-2 border-sand-4 bg-sand-2 p-3">
            <div className="flex h-[50px] items-center justify-between rounded-[2px] border border-sand-4 bg-sand-1 p-2">
              <SkeletonLine className="h-4 w-28" />
              <SkeletonLine className="h-3 w-20" />
            </div>

            <div className="border border-sand-4 bg-sand-1 p-3">
              <SkeletonLine className="h-4 w-24" />
              <div className="mt-2 flex flex-col gap-2">
                <SkeletonSkillCard />
                <SkeletonSkillCard />
              </div>
            </div>

            <div className="border border-sand-4 bg-sand-1 p-3">
              <SkeletonLine className="h-4 w-28" />
              <div className="mt-2 flex flex-col gap-2">
                <SkeletonSkillCard />
                <SkeletonSkillCard />
                <SkeletonSkillCard />
              </div>
            </div>

            <SkeletonLine className="mt-auto h-3 w-36 self-center" />
          </aside>
        </div>
      </div>
    </main>
  );
}
