import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaGithub,
  FaExclamationTriangle,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import sanityClient from "../sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import { PortableText } from "@portabletext/react";
import DevhubItemSkeleton from "./DevhubItemSkeleton";
import Modal from "react-modal";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import devhub1 from "../assets/devhub1.svg";
import devhub2 from "../assets/devhub2.svg";

// --- Sanity Image URL Builder Setup ---
const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  if (source?.asset) {
    return builder.image(source);
  }
  return null;
}

async function getBlog(slug) {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    subtitle,
    image, 
    chainlinkProducts,
    productVersions,
    readTime,
    requires,
    body[]{
     ..., 
      _type == 'image' => {
        ..., 
        asset-> { 
          _id,
          url,
          metadata { 
            dimensions,
            lqip 
          }
        }
      },
       _type == 'stepsAccordion' => {
        _key, 
        _type, 
        heading,
        steps[] {
          _key,
          title,
          content[]{ 
            ...,     
            markDefs[]{
              ...,
              _type == 'link' => { ..., href } 
            },
            children[]{...}
          }
        }
      },
      _type == 'youtube' => { ..., url },
      _type == 'buttonLink' => { ..., url, text },
      _type == 'disclaimer' => { ..., title, text }
    },
    headingPairs[] {
      displayHeading, 
      h2Heading      
    },    
    slug { current }, 
    githubUrl,
    redirect
}`;

  return sanityClient.fetch(query, { slug });
}

function CodeBlock({ value }) {
  const [isCopied, setIsCopied] = useState(false);

  if (!value?.code) {
    return null;
  }

  const language = value.language || "text";
  const codeString = String(value.code).trim();
  const filename = value.filename;

  const handleCopy = () => {
    if (!codeString) return;
    navigator.clipboard
      .writeText(codeString)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy code: ", err);
      });
  };

  return (
    <div className="relative group my-6 rounded-lg overflow-hidden bg-[#141414] shadow-md border border-gray-700/50">
      {filename && (
        <div className="bg-[#141414] px-4 py-1.5 text-xs text-gray-300 font-mono border-b border-gray-600/80 flex justify-between items-center">
          <span>{filename}</span>
          <button
            onClick={handleCopy}
            className="p-1 bg-white hover:bg-gray-200 rounded text-[#141414] text-[6px] transition-all duration-150 opacity-70 group-hover:opacity-100"
            aria-label="Copy code to clipboard"
            title={isCopied ? "Copied!" : "Copy code"}
          >
            {isCopied ? (
              <FaCheck className="w-3 h-3 text-green-600" />
            ) : (
              <FaCopy className="w-3 h-3" />
            )}
          </button>
        </div>
      )}

      {!filename && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1 bg-white hover:bg-gray-200 rounded text-[#141414] text-[6px] transition-all duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Copy code to clipboard"
          title={isCopied ? "Copied!" : "Copy code"}
        >
          {isCopied ? (
            <FaCheck className="w-3 h-3 text-green-600" />
          ) : (
            <FaCopy className="w-3 h-3" />
          )}
        </button>
      )}

      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          padding: "1.25rem",
          paddingTop: filename ? "0.75rem" : "1.50rem",
          margin: 0,
          borderRadius: filename ? "0" : "0 0 0.5rem 0.5rem",
          fontSize: "0.875rem",
        }}
        wrapLines={true}
        // showLineNumbers={true}
        // lineNumberStyle={{
        //   minWidth: "2.5em",
        //   paddingRight: "1em",
        //   textAlign: "right",
        //   opacity: 0.4,
        //   userSelect: "none",
        //   display: "inline-block",
        // }}
        codeTagProps={{
          style: {
            fontFamily: '"Fira Code", "Source Code Pro", monospace',
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          },
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

// ButtonLink Component
const ButtonLink = ({ value }) => {
  if (!value?.url || !value?.text) {
    return null;
  }
  return (
    <div className="my-8 flex justify-start relative bg-[#222222] text-black border border-black px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-max">
      <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
      <span className="absolute inset-0 bg-white rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
      <a
        href={value.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 text-black font-semibold text-lg"
      >
        {value.text}
      </a>
    </div>
  );
};

// Disclaimer Component
const Disclaimer = ({ value }) => {
  if (!value?.text) {
    return null;
  }
  return (
    <div className="rounded-2xl bg-[#F9FFE1] p-6 my-8 text-black shadow">
      <div className="flex items-center mb-3">
        <FaExclamationTriangle className="text-red-500 mr-3 text-xl flex-shrink-0" />
        <h3 className="font-bold text-lg text-black">
          {value.title || "Disclaimer"}
        </h3>
      </div>
      <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
        {value.text}
      </p>
    </div>
  );
};

const portableTextComponents = {
  types: {
    image: ({ value }) => (
      <div className="my-10 w-full h-auto">
        {value?.asset?.url && (
          <img
            src={value.asset.url}
            alt={value.alt || "Blog Image"}
            width={2500}
            height={2000}
            className="rounded-2xl !relative w-full h-auto"
          />
        )}
      </div>
    ),
    youtube: ({ value }) => (
      <div className="my-4 aspect-w-16 aspect-h-9">
        <iframe
          className="w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${value?.url?.split("v=")[1]}`}
          title="YouTube video player"
          style={{ border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    ),
    buttonLink: ButtonLink,
    disclaimer: Disclaimer,
    stepsAccordion: ({ value }) => (
      <StepsAccordion
        value={value}
        portableTextComponents={portableTextComponents}
      />
    ),
    codeBlock: CodeBlock,
    code: CodeBlock,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-700/50 text-red-300 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 my-4 space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 my-4 space-y-1">{children}</ol>
    ),
  },
  listItem: ({ children }) => (
    <li className="text-xs sm:text-sm xl:text-base 2xl:text-lg">{children}</li>
  ),
  block: {
    h2: ({ children }) => (
      <h2
        id={children?.[0]}
        className="font-actayWide text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-bold mt-12 mb-5 pt-4 border-t border-gray-700/50"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={children?.[0]}
        className="text-lg sm:text-xl xl:text-2xl 2xl:text-3xl font-semibold mt-8 mb-4"
      >
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="my-4 text-xs sm:text-sm xl:text-base 2xl:text-lg leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-500 pl-4 italic my-6 text-gray-400">
        {children}
      </blockquote>
    ),
  },
};

const StepsAccordion = ({ value }) => {
  const [openSteps, setOpenSteps] = React.useState({});

  if (!value?.steps || value.steps.length === 0) {
    return null;
  }

  const toggleStep = (index) => {
    setOpenSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="my-10">
      {value.heading && (
        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">
          {value.heading}
        </h2>
      )}
      <div className="space-y-3">
        {value.steps.map((step, index) => (
          <div
            key={step._key || index}
            className="bg-[#242323] rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <button
              onClick={() => toggleStep(index)}
              className="w-full flex justify-between items-center px-5 py-4 text-left text-white" // Added focus styles
              aria-expanded={!!openSteps[index]}
              aria-controls={`step-content-${index}`}
            >
              <span className="font-medium text-base md:text-lg flex items-center">
                <span className="mr-3 text-gray-400">{index + 1}</span>{" "}
                {step.title || `Step ${index + 1}`}
              </span>
              <svg
                className={`w-5 h-5 transform transition-transform duration-300 text-gray-400 ${openSteps[index] ? "rotate-180" : "rotate-0"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            <div
              id={`step-content-${index}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openSteps[index] ? "max-h-screen" : "max-h-0"}`}
            >
              <div className="px-5 pb-5 pt-2 bg-[#242323]">
                {step.content && (
                  <PortableText
                    value={step.content}
                    components={portableTextComponents}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function DevhubItem() {
  const { slug } = useParams();
  const [postData, setPostData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  useEffect(() => {
    async function fetchData() {
      if (!slug) {
        setIsLoading(false);
        setError("No post specified.");
        return;
      }

      setIsLoading(true);
      setPostData(null);
      setError(null);
      try {
        const data = await getBlog(slug);
        console.log("data", data);

        if (data) {
          setPostData(data); // Store fetched data in state
        } else {
          setError("Post not found.");
        }
      } catch (err) {
        console.error("Error fetching post from Sanity:", err);
        setError("Failed to load post data.");
      } finally {
        setIsLoading(false); // Ensure loading is set to false
      }
    }

    fetchData();
  }, [slug]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!postData || isLoading || error) {
      return; // Don't run if no data, loading, or error
    }

    const handleScroll = () => {
      const headings = document.querySelectorAll("h2");
      let currentActive = "";

      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();

        // If heading is above 120px, set it as active
        if (rect.top <= 250) {
          currentActive = headings[i].innerText;
        } else {
          break; // Stop checking further, as the next heading hasn't reached 120px yet
        }
      }
      setActiveHeading(currentActive);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [error, isLoading, postData]);

  if (isLoading) {
    return <DevhubItemSkeleton />; // <--- Use the skeleton component here
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Post not found.</p>
      </div>
    );
  }

  const handleOpenModal = (e) => {
    e.preventDefault(); // Prevent default link behavior
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  const ActionButtons = ({ className = "" }) => (
    <div
      className={`flex flex-col sm:flex-row justify-center items-center gap-4 ${className}`}
    >
      {/* Github Button */}
      <div className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full sm:w-max flex items-center justify-center">
        <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
        <span className="absolute inset-0 bg-[#F8FF7C] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
        <a
          href={postData.githubUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-[130px] relative z-10 rounded-full transition-all duration-300 ease-out text-xs sm:text-base flex items-center justify-center"
        >
          <FaGithub className="mr-2 flex-shrink-0" />
          <span className="text-center">Open Github</span>
        </a>
      </div>

      <div className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-full sm:w-max flex items-center justify-center">
        <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
        <span className="absolute inset-0 bg-[#F8FF7C] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
        <div className="w-full sm:w-max relative z-10 rounded-full transition-all duration-300 ease-out text-xs sm:text-base flex items-center justify-center">
          <a
            href={postData.redirect || "#"}
            rel="noopener noreferrer"
            className="w-full sm:w-[130px] relative z-10 rounded-full transition-all duration-300 ease-out text-xs sm:text-base flex items-center justify-center bg-[#F8FF7C] text-black"
          >
            ⚡ Try Now
          </a>
        </div>
      </div>
      {/* Try Now Button (NO Modal inside) */}
    </div>
  );

  // --- Get Image URL Safely ---
  const headerImageUrl = urlFor(postData.image)
    ?.width(1200)
    .auto("format")
    .url();

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 min-h-screen md:mt-[17rem] mt-[10rem]">
      <div className="max-w-4xl mx-auto text-center mb-16">
        {/* <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-white !leading-[60px]">
          {postData.title}
        </h1> */}
        {/* {postData.subtitle && (
          <h4 className="text-sm sm:text-base lg:text-lg text-[#A2A2A2] leading-relaxed">
            {postData.subtitle}
          </h4>
        )} */}
      </div>

      {/* Main Content Area */}
      <div className="bg-[#131313] rounded-3xl border border-gray-700 p-6 w-[90%] mx-auto">
        {/* Top Section */}
        <div className="mb-4 sm:mb-8">
          {headerImageUrl ? (
            <div className="w-[95%] mx-auto rounded-3xl overflow-hidden h-max">
              <img
                src={headerImageUrl}
                alt={postData.title || "Header image"}
                className="!relative w-full h-auto"
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-800 h-60 flex items-center justify-center w-full mb-8 text-gray-500">
              No Image Available
            </div>
          )}

          {/* Info Grid */}
          <div className="text-[8px] xs:text-xs sm:text-base flex items-center justify-center mt-3">
            <span className="text-gray-400 mr-2">Requires:</span>
            <span className="text-white">
              {postData.requires || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-8 w-[87%] mx-auto">
        {/* Table of Content */}
        <aside className="w-full md:w-1/4 min-w-[180px] lg:min-w-[230px] md:sticky top-24 h-full">
          {/* Mobile Dropdown */}
          <div className="md:hidden relative my-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex justify-between items-center px-4 py-2 bg-[#141313] text-white rounded-lg border border-[#5F5F5F] text-xs font-actayWide"
            >
              Table Of Content
              <span
                className={`transform transition ${isOpen ? "rotate-180" : ""}`}
              >
                {/* <img src={arrow} alt="arrow"></Image> */}
              </span>
            </button>

            {isOpen && (
              <ul className="absolute w-full bg-[#141313] text-white rounded-lg border border-[#5F5F5F] mt-2 shadow-lg z-10 text-xs font-actay">
                {postData.headingPairs?.map((pair, index) => (
                  <li key={index} className="py-2 px-2">
                    <a
                      href={`#${pair.h2Heading}`}
                      onClick={(e) => {
                        console.log(pair.h2Heading);
                        e.preventDefault();
                        const targetElement = document.getElementById(
                          pair.h2Heading
                        );
                        if (targetElement) {
                          const yOffset = -160; // Adjust the offset (200px from top)
                          const y =
                            targetElement.getBoundingClientRect().top +
                            window.scrollY +
                            yOffset;
                          window.scrollTo({ top: y, behavior: "smooth" });
                        }
                      }}
                      className={`text-xs hover:underline ${activeHeading === pair.h2Heading
                          ? "text-green-400 font-bold"
                          : "text-gray-300"
                        }`}
                    >
                      [ {index + 1} ] {pair.displayHeading}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h2 className="hidden md:block font-actayWide text-sm lg:text-lg font-extrabold my-10">
            Table of Content
          </h2>
          <ul className="hidden md:block space-y-2 font-actay">
            {postData.headingPairs?.map((pair, index) => (
              <li key={index}>
                <a
                  href={`#${pair.h2Heading}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetElement = document.getElementById(
                      pair.h2Heading
                    );
                    if (targetElement) {
                      const yOffset = -160; // Adjust the offset (200px from top)
                      const y =
                        targetElement.getBoundingClientRect().top +
                        window.scrollY +
                        yOffset;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }
                  }}
                  className={`text-xs lg:text-sm 2xl:text-base hover:underline ${activeHeading === pair.h2Heading
                      ? "text-green-400 font-bold"
                      : "text-gray-300"
                    }`}
                >
                  [ {index + 1} ] {pair.displayHeading}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Blog Content */}
        <article className="w-full md:w-3/4 md:mt-10">
          <PortableText
            value={postData.body}
            components={portableTextComponents}
          />

          <div className="bg-[#141414] rounded-2xl w-full relative h-[300px] flex flex-col gap-3 items-center justify-center p-[50px] overflow-hidden">
            <div className="z-0 absolute left-0 bottom-0 w-[120px] lg:w-[140px] h-max">
              <img src={devhub1} alt="sideimg" className="w-full h-auto"></img>
            </div>
            <div className="z-0 absolute right-0 top-0 w-[140px] lg:w-[160px] h-max">
              <img src={devhub2} alt="sideimg" className="w-full h-auto"></img>
            </div>
            <p className="relative z-30 max-w-[500px] lg:max-w-[600px] mx-auto text-wrap text-center text-xs sm:text-sm lg:text-base">
              View the complete code and our ready-to-use template
            </p>
            <ActionButtons />
          </div>

          <div className="relative bg-[#222222] text-[#000000] my-16 border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-max mx-auto flex items-center justify-center">
            <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
            <span className="absolute inset-0 bg-white rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
            <div className="w-max relative z-10 rounded-full transition-all duration-300 ease-out text-xs sm:text-base flex items-center">
              <a
                href={"/devhub"}
                className="w-max relative z-10 rounded-full transition-all duration-300 ease-out text-xs sm:text-base flex items-center text-black"
              >
                Go Back to DevHub
              </a>
            </div>
          </div>
        </article>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleClose}
        contentLabel="Try Template"
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#141414] px-8 py-6 rounded-2xl border border-white/10 backdrop-blur-xl w-full max-w-md z-[10000]"
        overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
      >
        <button
          onClick={handleClose}
          className="absolute top-2.5 right-6 text-gray-400 hover:text-white text-2xl font-bold focus:outline-none"
        >
          ×
        </button>
        <div className="text-white p-6 text-center">
          <h2 className="text-[20px] text-center font-semibold my-4">
            🛠️ In Progress
          </h2>
          <p>Try our ready-to-use template here</p>
          <div className="relative bg-[#222222] text-[#000000] border border-[#222222] px-6 py-2 sm:px-8 sm:py-3 rounded-full group transition-transform w-max mx-auto flex items-center justify-center mt-5">
            <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
            <span className="absolute inset-0 bg-[#F8FF7C] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
            <a
              href="/eth-top-ups-example"
              className="w-max relative z-10 rounded-full transition-all duration-300 ease-out text-xs sm:text-base flex items-center"
            >
              Go to Template
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DevhubItem;
