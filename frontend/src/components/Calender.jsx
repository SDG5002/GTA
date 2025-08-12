import Calendar from 'react-calendar'
import './Calender.css'

function Calender() {
  return (
    <>
     <Calendar
          className="custom-calendar"
          prevLabel="←"
          nextLabel="→"
          prev2Label={null}
          next2Label={null}
    />
    </>
  )
}

export default Calender