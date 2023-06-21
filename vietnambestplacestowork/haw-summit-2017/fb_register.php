<?php

use Mio\D7ServiceContainer\ServiceContainer;

require __DIR__ . '/../../vendor/autoload.php';

/** @var \GuzzleHttp\Psr7\ServerRequest $request */
$request = ServiceContainer::service('server_request');

if ($request->getMethod() == 'POST') {
    $event_manager = new \Event\EventManager();
    $event         = $event_manager->getCurrentEvent();

    $current_event = $event->getName();
    $form_values   = $request->getParsedBody();
    $message_body  = event_message_template($form_values);
    $message_title = "Event register: " . $event->getName() . " - " . strip_tags($form_values['first_name']);

    $message = Swift_Message::newInstance()
      // Give the message a subject
                            ->setSubject($message_title)
      // Set the From address with an associative array
                            ->setFrom('no-reply@anphabe-notification.com')
      // Set the To addresses with an associative array
                            ->setTo(explode(',', ServiceContainer::getContainer()->getParameter('mail_to')))
      // Give it a body
                            ->setBody($message_body, 'text/html');

    $sent = \Mio\D7ServiceContainer\ServiceContainer::service('mailer')->send($message);
    $data = ['sent' => $sent];
    echo json_encode($data);
    exit;

}

function event_message_template($form_values) {
    $data = [
      'name'      => empty($form_values['name']) ? '' : strip_tags($form_values['name']),
      'email'     => empty($form_values['email']) ? '' : strip_tags($form_values['email']),
      'phone'     => empty($form_values['phone']) ? '' : strip_tags($form_values['phone']),
      'job_title' => empty($form_values['job_title']) ? '' : strip_tags($form_values['job_title']),
      'last_name' => empty($form_values['last_name']) ? '' : strip_tags($form_values['last_name']),
      'company'   => empty($form_values['company']) ? '' : strip_tags($form_values['company']),
    ];

    // Place

    $content = '<b>Name: </b>' . $data['name'];
    $content .= '<br><b>Email: </b>' . $data['email'];
    $content .= "<br/><b>Phone: </b>" . $data["phone"];
    $content .= "<br/><b>Job Title: </b>" . $data["job_title"];
    $content .= "<br/><b>Company: </b>" . $data["company"];

    return $content;

}
