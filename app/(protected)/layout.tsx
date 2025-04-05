import Navbar from "./_components/navbar";

interface ProtectedLayoutpage{
    children: React.ReactNode
}

const ProtectedLayout = ({children}: ProtectedLayoutpage) => {
  return (
    <div className="h-full w-full flex flex-col gap-y-4 items-center justify-center bg-gradient-to-b from-sky-400 to-blue-800">
      <Navbar />
      {children}
    </div>
  )
}

export default ProtectedLayout;
