import { h, JSX } from "preact";

export function TopNavMenu(props: { maxWidth?: number; current: string }): JSX.Element {
  return (
    <nav
      class="w-full flex items-center mx-auto my-0 px-2 py-6 flex-col md:px-2 md:py-12 sm:flex-row"
      style={{ maxWidth: props.maxWidth ? `${props.maxWidth}px` : "800px" }}
    >
      <div class="flex-1 flex items-center mb-4 sm:mb-0 cursor-pointer" style={{ minWidth: "14rem" }}>
        <a href="/" class="text-gray-900 no-underline">
          <img
            className="inline align-middle"
            style={{ width: "4em", height: "4em" }}
            src="/images/logo.svg"
            alt="Liftosaur Logo"
          />
          <span
            className="inline text-3xl font-bold leading-loose text-gray-900 align-middle"
            style={{ marginLeft: "8px", fontFamily: "Poppins" }}
          >
            Liftosaur
          </span>
        </a>
      </div>
      <div className="flex items-center justify-center w-full sm:block sm:w-auto">
        <ul className="flex-1 inline-block font-bold align-middle list-none">
          {[
            ["About", "/about"],
            ["Docs", "/docs/docs.html"],
            ["Blog", "/blog"],
            ["Web Editor", "/program"],
            ["Workout Planner", "/planner"],
          ].map(([text, link]) => {
            return (
              <li className="inline-block mx-3 mb-2 leading-5 align-middle list-none">
                {props.current === link ? (
                  <strong>{text}</strong>
                ) : (
                  <a className="text-blue-700 underline cursor-pointer" href={link}>
                    {text}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <ul className="inline-block align-middle list-none">
          {[
            ["Instagram", "https://www.instagram.com/liftosaurapp", "logo-instagram"],
            ["Twitter", "https://www.twitter.com/liftosaur", "logo-twitter"],
            ["Reddit", "https://www.reddit.com/r/liftosaur", "logo-reddit"],
            ["Discord", "https://discord.gg/AAh3cvdBRs", "logo-discord"],
          ].map(([text, link, img]) => {
            return (
              <li className="inline-block align-middle list-none">
                <a
                  target="_blank"
                  href={link}
                  style={{
                    textIndent: "-9999px",
                    backgroundPosition: "50%",
                    backgroundSize: "60%",
                    backgroundImage: `url(/images/${img}.svg)`,
                  }}
                  className="inline-block w-10 h-10 p-2 bg-no-repeat"
                >
                  <span>{text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
