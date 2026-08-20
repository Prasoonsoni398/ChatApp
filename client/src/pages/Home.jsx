import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { BsRocketTakeoff, BsLightningChargeFill, BsShieldLockFill, BsStars, BsChatDotsFill } from "react-icons/bs";
import heroImage from "../assets/heroSection.png";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/chat');
    }
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } },
  };

  const floatVariant = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-between overflow-hidden">
      
      <div className="flex-grow flex flex-col items-center justify-center p-6 w-full">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mt-12  max-w-7xl w-full">
          <motion.div
            className="text-center lg:text-left lg:w-1/2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-block mb-4" whileHover={{ scale: 1.1 }}>
              <span className="badge badge-primary badge-outline badge-lg px-4 py-3 font-semibold cursor-pointer flex items-center gap-2">
                <BsRocketTakeoff /> The Next Gen Chat App
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-extrabold text-base-content mb-6 tracking-tight leading-tight"
            >
              Connect with <span className="text-primary hover:text-secondary transition-colors duration-300">Anyone</span> <br />
              Anywhere.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-base-content/80 mb-10 max-w-2xl mx-auto lg:mx-0 font-medium"
            >
              Experience seamless, real-time messaging with top-tier security and a
              beautiful, intuitive design. Stay close to the people who matter most.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/signup"
                  className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary/30 w-full sm:w-auto"
                >
                  Get Started Free
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/login"
                  className="btn btn-outline btn-secondary btn-lg rounded-full px-8 w-full sm:w-auto"
                >
                  Login
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
          
          <motion.div
            className="lg:w-1/2 flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <img src={heroImage} alt="Hero illustration" className="max-w-full h-auto object-contain" />
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 mb-16 max-w-6xl w-full"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {[
            {
              title: "Real-Time Chat",
              desc: "Lightning fast message delivery with instant read receipts.",
              icon: <BsLightningChargeFill />,
              iconBg: "bg-warning/20",
              iconColor: "text-warning"
            },
            {
              title: "End-to-End Secure",
              desc: "Your conversations are private, encrypted, and safe from prying eyes.",
              icon: <BsShieldLockFill />,
              iconBg: "bg-success/20",
              iconColor: "text-success"
            },
            {
              title: "Beautiful UI",
              desc: "A sleek, modern interface powered by FlyonUI that is a joy to use everyday.",
              icon: <BsStars />,
              iconBg: "bg-primary/20",
              iconColor: "text-primary"
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -10 }}
              className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 !rounded-3xl"
            >
              <div className="card-body items-center text-center">
                <motion.div variants={floatVariant} animate="animate" className={`text-6xl mb-4 ${feature.iconBg} ${feature.iconColor} p-4 rounded-2xl`}>
                  {feature.icon}
                </motion.div>
                <h2 className="card-title text-2xl text-base-content mb-2">
                  {feature.title}
                </h2>
                <p className="text-base-content/70 font-medium">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer Section */}
      <footer className="footer p-10 bg-base-300 text-base-content mt-auto w-full border-t border-base-200">
        <aside>
          <motion.div whileHover={{ rotate: 20 }} className="text-4xl mb-2 cursor-pointer text-primary">
            <BsChatDotsFill />
          </motion.div>
          <p className="font-bold text-lg">ChatApp Industries Ltd.<br/><span className="font-normal text-base-content/70">Providing reliable tech since 2024</span></p>
        </aside> 
        <nav>
          <h6 className="footer-title text-primary">Services</h6> 
          <a className="link link-hover hover:text-primary transition-colors">Branding</a>
          <a className="link link-hover hover:text-primary transition-colors">Design</a>
          <a className="link link-hover hover:text-primary transition-colors">Marketing</a>
        </nav> 
        <nav>
          <h6 className="footer-title text-secondary">Company</h6> 
          <a className="link link-hover hover:text-secondary transition-colors">About us</a>
          <a className="link link-hover hover:text-secondary transition-colors">Contact</a>
          <a className="link link-hover hover:text-secondary transition-colors">Jobs</a>
        </nav> 
        <nav>
          <h6 className="footer-title text-accent">Legal</h6> 
          <a className="link link-hover hover:text-accent transition-colors">Terms of use</a>
          <a className="link link-hover hover:text-accent transition-colors">Privacy policy</a>
          <a className="link link-hover hover:text-accent transition-colors">Cookie policy</a>
        </nav>
      </footer>
    </div>
  );
};

export default Home;
